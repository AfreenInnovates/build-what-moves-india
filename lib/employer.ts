import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { query, one } from './db';
import type { GateId } from './gates/types';

/**
 * The employer's side of a claim.
 *
 * A member's claim stalls because somebody in an HR office has to act on a
 * portal they log into twice a month, with nobody telling them it is waiting.
 * The link a member sends does not open a single form - it opens a queue, the
 * way a real employer would need it, because one establishment has many former
 * employees and they all stall for the same reasons.
 */

/** Lower-case, hyphenated, ASCII only - safe in a path and easy to read aloud. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function secret(): string {
  return process.env.EMPLOYER_LINK_SECRET ?? process.env.DATABASE_URL ?? 'seven-gates-dev';
}

/**
 * A handle for an establishment: readable, with a short keyed suffix.
 *
 * It started as the company name in base64, which was unreadable and trivially
 * decoded. Replacing it with a bare digest fixed that and made the link
 * meaningless to look at - nobody can tell where a link goes before they open
 * it, which is its own problem when the thing you are asking is "please trust
 * this and click it".
 *
 * So: the name, plus four characters derived from a server key. You can read it,
 * and you still cannot type your way into somebody else's queue by guessing.
 * What it deliberately does NOT contain is any case identifier - those open a
 * member's own dashboard, and this link gets forwarded around WhatsApp.
 */
export function employerToken(employerName: string): string {
  const sig = createHmac('sha256', secret()).update(employerName).digest('hex').slice(0, 4);
  return `${slugify(employerName)}-${sig}`;
}

/** Which establishment a handle refers to, or null. Compared, never decoded. */
export async function employerFromToken(token: string): Promise<string | null> {
  if (!/^[a-z0-9-]{3,48}$/.test(token)) return null;
  const rows = await query<{ employer_name: string }>(
    `select distinct employer_name from members where employer_name is not null`,
  );
  for (const r of rows) {
    const expected = employerToken(r.employer_name);
    if (expected.length === token.length && timingSafeEqual(Buffer.from(expected), Buffer.from(token))) {
      return r.employer_name;
    }
  }
  return null;
}

export type RequestStatus = 'pending' | 'viewed' | 'done';

export interface EmployerRequest {
  ref: string;
  case_id: string;
  gate_id: GateId;
  status: RequestStatus;
  created_at: string;
  viewed_at: string | null;
  done_at: string | null;
  display_name: string;
  uan: string;
  date_of_exit: string | null;
  slug: string;
}

/** Member sends the request. Re-sending the same one does not duplicate it. */
export async function sendRequest(
  caseId: string,
  gateId: GateId,
  employerName: string,
  memberName: string,
) {
  await query(
    `insert into employer_requests (case_id, gate_id, employer_name, ref)
     values ($1, $2, $3, $4)
     on conflict (case_id, gate_id) do update
       set status = case when employer_requests.status = 'done' then 'done' else 'pending' end`,
    [caseId, gateId, employerName, `${slugify(memberName)}-${gateId.replace(/_/g, '-')}`],
  );
}

/** What this member has already sent, so their page can show where it stands. */
export async function requestsForCase(caseId: string) {
  return query<{ gate_id: GateId; status: RequestStatus; viewed_at: string | null }>(
    `select gate_id, status, viewed_at from employer_requests where case_id = $1`,
    [caseId],
  );
}

/** Everything sitting with one establishment, newest first. */
export async function requestsForEmployer(employerName: string): Promise<EmployerRequest[]> {
  return query<EmployerRequest>(
    `select r.ref, r.case_id, r.gate_id, r.status, r.created_at, r.viewed_at, r.done_at,
            m.display_name, m.uan, m.date_of_exit, m.slug
       from employer_requests r
       join cases c on c.id = r.case_id
       join members m on m.id = c.member_id
      where r.employer_name = $1
      order by (r.status = 'done'), r.created_at desc`,
    [employerName],
  );
}

/** One request, found by its own opaque reference rather than by case id. */
export async function requestByRef(employerName: string, ref: string) {
  if (!/^[a-z0-9-]{3,80}$/.test(ref)) return null;
  return one<EmployerRequest>(
    `select r.ref, r.case_id, r.gate_id, r.status, r.created_at, r.viewed_at, r.done_at,
            m.display_name, m.uan, m.date_of_exit, m.slug
       from employer_requests r
       join cases c on c.id = r.case_id
       join members m on m.id = c.member_id
      where r.employer_name = $1 and r.ref = $2`,
    [employerName, ref],
  );
}

/**
 * The employer opened it. Recorded so the member can see somebody is looking,
 * which is the single most reassuring thing to know while waiting.
 */
export async function markViewed(employerName: string, ref: string) {
  await query(
    `update employer_requests set status = 'viewed', viewed_at = now()
      where employer_name = $1 and ref = $2 and status = 'pending'`,
    [employerName, ref],
  );
}

export async function markDone(employerName: string, ref: string) {
  await query(
    `update employer_requests set status = 'done', done_at = now()
      where employer_name = $1 and ref = $2`,
    [employerName, ref],
  );
}

export interface EmployerCard {
  name: string;
  token: string;
  /** how many former employees are waiting on this establishment */
  waiting: number;
  /** how many they have already dealt with */
  done: number;
  /** the people whose records this establishment can still fix */
  members: number;
}

/**
 * The establishments a visitor can sign in as.
 *
 * Every company in the demo appears, not only the ones with something waiting -
 * an employer with an empty queue is a real state and worth being able to see.
 * The counts come from the requests actually sent, so the list moves as the
 * member side is used.
 */
export async function listEmployers(): Promise<EmployerCard[]> {
  /**
   * Only establishments that actually have something to show.
   *
   * Listing every company in the demo meant five identical empty queues beside
   * one real one, which teaches a visitor nothing and invites them to click the
   * boring ones. An employer with no requests has no reason to be offered.
   */
  const rows = await query<{ name: string; members: number; waiting: number; done: number }>(
    `select m.employer_name as name,
            count(distinct m.id)::int as members,
            count(*) filter (where r.status in ('pending','viewed'))::int as waiting,
            count(*) filter (where r.status = 'done')::int as done
       from employer_requests r
       join cases c on c.id = r.case_id
       join members m on m.id = c.member_id
      group by m.employer_name
      order by count(*) filter (where r.status in ('pending','viewed')) desc, m.employer_name`,
  );
  return rows.map((r) => ({ ...r, token: employerToken(r.name) }));
}
