import 'server-only';
import { cache } from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { query, one } from './db';
import { SPEC } from './gates/spec';
import { resolve } from './gates/resolve';
import { deriveFacts, type MemberRecord, type ServiceRow, type Intake } from './gates/facts';
import type { CaseFacts, GateId, Resolution } from './gates/types';

export interface MemberRow extends MemberRecord {
  id: string;
  slug: string;
  display_name: string;
  scenario: string;
  headline: string | null;
  demo_password: string;
  employer_name: string;
  epfo_name: string | null;
  epfo_dob: string | null;
  epfo_father_name: string | null;
}

export interface CaseView {
  caseId: string;
  member: MemberRow;
  facts: CaseFacts;
  resolution: Resolution;
  /** the number the countdown should animate FROM, so a refresh does not re-animate */
  previousDays: number | null;
  documents: Record<string, DocumentValues>;
  history: CaseEvent[];
}

export interface DocumentValues {
  name: string;
  dob?: string;
  father_name?: string;
  script?: string;
  name_native?: string;
  [k: string]: unknown;
}

export interface CaseEvent {
  type: string;
  payload: { gate?: GateId; label?: string } | null;
  days_remaining: number | null;
  at: string;
}

/** Documents still come from fixtures; the matcher that reads them lands in slice 3. */
function fixtureFor(slug: string): Record<string, unknown> {
  const file = path.join(process.cwd(), 'fixtures', 'data', `${slug}.json`);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function documentsFor(slug: string): Record<string, DocumentValues> {
  return (fixtureFor(slug).documents as Record<string, DocumentValues>) ?? {};
}

/** The triage answers a persona would have given, so each demo starts in character. */
export function intakeFor(slug: string): Partial<Intake> {
  return (fixtureFor(slug).intake as Partial<Intake>) ?? {};
}

/**
 * Stand-in for the deterministic matcher (slice 3). It counts how many of the
 * compared fields disagree across the four records — name, date of birth and
 * parent name — because a mismatch on any one of them is a rejection. The real
 * one bands each pair and explains which value wins and why.
 */
export function countBlockingMismatches(docs: Record<string, DocumentValues>): number {
  const values = Object.values(docs);
  if (values.length < 2) return 0;
  const fields: (keyof DocumentValues)[] = ['name', 'dob', 'father_name'];
  return fields.filter((f) => {
    const seen = new Set(values.map((d) => d[f]).filter(Boolean));
    return seen.size > 1;
  }).length;
}

export async function listMembers(): Promise<MemberRow[]> {
  return query<MemberRow>(`select * from members order by scenario desc, slug`);
}

/**
 * Members with their service history attached, in a single round trip. The
 * obvious version issues one query per member; at ~230ms to Neon that turned
 * the account picker into a two-second wait.
 */
export async function listMembersWithService(): Promise<(MemberRow & { service: ServiceRow[] })[]> {
  return query<MemberRow & { service: ServiceRow[] }>(
    `select m.*, coalesce(
       (select json_agg(json_build_object(
          'uan', s.uan, 'from_date', s.from_date,
          'to_date', s.to_date, 'eps_months', s.eps_months))
        from service_history s where s.member_id = m.id), '[]'::json) as service
     from members m
     order by m.scenario desc, m.slug`,
  );
}

/**
 * One case per member for the demo, so a returning visitor resumes rather than
 * starting over. Real multi-tenant use would key this on a session instead.
 */
export async function startCase(slug: string): Promise<string | null> {
  // member, any existing case, and the service history together
  const row = await one<{
    member: MemberRow;
    existing_case: string | null;
    service: ServiceRow[];
  }>(
    `select to_jsonb(m.*) as member,
            (select c.id from cases c where c.member_id = m.id
              order by c.created_at desc limit 1) as existing_case,
            coalesce((
              select json_agg(json_build_object(
                'uan', s.uan, 'from_date', s.from_date,
                'to_date', s.to_date, 'eps_months', s.eps_months))
                from service_history s where s.member_id = m.id), '[]'::json) as service
       from members m where m.slug = $1`,
    [slug],
  );
  if (!row) return null;
  if (row.existing_case) return row.existing_case;

  const member = row.member;
  const service = row.service ?? [];

  const blockingMismatches = countBlockingMismatches(documentsFor(member.slug));

  const intake = intakeFor(member.slug);
  const facts = deriveFacts(member, service, blockingMismatches, intake);
  const r = resolve(SPEC, facts);

  const created = await one<{ id: string }>(
    `insert into cases (member_id, intake, facts, spec_version)
     values ($1, $2, $3, $4) returning id`,
    [member.id, intake, facts, SPEC.version],
  );
  const caseId = created!.id;

  await persistGateStates(caseId, r);
  await query(
    `insert into events (case_id, type, payload, days_remaining) values ($1,$2,$3,$4)`,
    [caseId, 'case_opened', { gates: r.blockingCount }, r.totalDays],
  );

  return caseId;
}

/**
 * Deduped for the render pass. The dashboard layout and the page inside it both
 * need the case; without this they each issue the same query, doubling the cost
 * of every screen.
 */
export const loadCase = cache(async (caseId: string): Promise<CaseView | null> => {
  // case, member and event history in a single round trip. Three separate
  // queries cost ~700ms from here; this costs ~230ms.
  const row = await one<{
    facts: CaseFacts;
    member: MemberRow;
    history: CaseEvent[];
  }>(
    `select c.facts,
            to_jsonb(m.*) as member,
            coalesce((
              select json_agg(json_build_object(
                       'type', e.type, 'payload', e.payload,
                       'days_remaining', e.days_remaining, 'at', e.at)
                     order by e.id desc)
                from (select id, type, payload, days_remaining, at
                        from events where case_id = c.id
                       order by id desc limit 12) e
            ), '[]'::json) as history
       from cases c join members m on m.id = c.member_id
      where c.id = $1`,
    [caseId],
  );
  if (!row) return null;

  const resolution = resolve(SPEC, row.facts);
  const history = row.history ?? [];

  // second-most-recent reading, so the countdown animates from where it was
  const priors = history.filter((e) => e.days_remaining !== null);
  const previousDays = priors.length > 1 ? priors[1].days_remaining : null;

  return {
    caseId,
    member: row.member,
    facts: row.facts,
    resolution,
    previousDays,
    documents: documentsFor(row.member.slug),
    history,
  };
});

/** What clearing each gate does to the facts. Replaced by real flows per gate. */
const CLEARS: Record<GateId, Partial<CaseFacts>> = {
  uan_active: { uanActive: true, aadhaarLinked: true },
  records_agree: { blockingMismatches: 0 },
  e_nomination: { eNominationFiled: true },
  exit_marked: { exitMarked: true },
  service_history: { distinctUanCount: 1, serviceGapMonths: 0 },
  form_selected: { formSelected: true },
  attachments: { form15gAttached: true },
};

export async function applyFix(caseId: string, gateId: GateId): Promise<void> {
  const row = await one<{ facts: CaseFacts }>(`select facts from cases where id = $1`, [caseId]);
  if (!row) return;

  const before = resolve(SPEC, row.facts);
  const facts = { ...row.facts, ...CLEARS[gateId] };
  const after = resolve(SPEC, facts);

  await query(`update cases set facts = $1, updated_at = now() where id = $2`, [facts, caseId]);
  await persistGateStates(caseId, after);
  await query(
    `insert into events (case_id, type, payload, days_remaining) values ($1,$2,$3,$4)`,
    [
      caseId,
      'gate_cleared',
      {
        gate: gateId,
        label: before.gates.find((g) => g.id === gateId)?.title ?? gateId,
        saved: before.totalDays - after.totalDays,
      },
      after.totalDays,
    ],
  );
}

export async function resetCase(caseId: string): Promise<void> {
  const row = await one<{ member_id: string; intake: Record<string, unknown> }>(
    `select member_id, intake from cases where id = $1`,
    [caseId],
  );
  if (!row) return;

  const member = await one<MemberRow>(`select * from members where id = $1`, [row.member_id]);
  if (!member) return;

  const service = await query<ServiceRow>(
    `select uan, from_date, to_date, eps_months from service_history where member_id = $1`,
    [member.id],
  );
  const facts = deriveFacts(
    member,
    service,
    countBlockingMismatches(documentsFor(member.slug)),
    intakeFor(member.slug),
  );

  await query(`update cases set facts = $1, updated_at = now() where id = $2`, [facts, caseId]);
  await query(`delete from events where case_id = $1`, [caseId]);
  await persistGateStates(caseId, resolve(SPEC, facts));
  await query(`insert into events (case_id, type, payload, days_remaining) values ($1,$2,$3,$4)`, [
    caseId,
    'case_opened',
    {},
    resolve(SPEC, facts).totalDays,
  ]);
}

async function persistGateStates(caseId: string, r: Resolution): Promise<void> {
  // One round trip, not seven. At ~230ms to Neon that is the difference between
  // a page that feels instant and one that visibly hangs.
  await query(
    `insert into gate_states (case_id, gate_id, status, reason, latency_days, actor, resolved_at)
     select $1, g.gate_id, g.status, g.reason, g.latency_days, g.actor,
            case when g.status = 'green' then now() else null end
       from jsonb_to_recordset($2::jsonb)
         as g(gate_id text, status text, reason text, latency_days int, actor text)
     on conflict (case_id, gate_id) do update set
       status = excluded.status, reason = excluded.reason,
       latency_days = excluded.latency_days, actor = excluded.actor,
       resolved_at = coalesce(gate_states.resolved_at, excluded.resolved_at)`,
    [
      caseId,
      JSON.stringify(
        r.gates.map((g) => ({
          gate_id: g.id,
          status: g.status,
          reason: g.blocks,
          latency_days: g.latencyDays,
          actor: g.actor,
        })),
      ),
    ],
  );
}
