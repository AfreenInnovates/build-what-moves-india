import 'server-only';
import { cache } from 'react';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { query, one } from './db';
import { SPEC } from './gates/spec';
import { resolve } from './gates/resolve';
import { deriveFacts, type MemberRecord, type ServiceRow, type Intake } from './gates/facts';
import type { CaseFacts, GateId, Resolution } from './gates/types';
import { SEEDED_RUNG, TYPICAL_DISPOSAL } from './escalation';

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
  documents?: Record<string, DocumentValues> | null;
}

export interface CaseView {
  caseId: string;
  member: MemberRow;
  facts: CaseFacts;
  resolution: Resolution;
  /** the number the countdown should animate FROM, so a refresh does not re-animate */
  previousDays: number | null;
  documents: Record<string, DocumentValues>;
  service: ServiceRow[];
  history: CaseEvent[];
  claimStatus: 'not_submitted' | 'submitted';
  claimReference: string | null;
  claimSubmittedAt: string | null;
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

export function documentsFor(slug: string, stored?: unknown): Record<string, DocumentValues> {
  // a DB-created profile carries its own documents; the seeded demos read theirs
  // from the fixture file. Either way, one source per member.
  if (stored && typeof stored === 'object') return stored as Record<string, DocumentValues>;
  return (fixtureFor(slug).documents as Record<string, DocumentValues>) ?? {};
}

/** The triage answers a persona would have given, so each demo starts in character. */
export function intakeFor(slug: string): Partial<Intake> {
  return (fixtureFor(slug).intake as Partial<Intake>) ?? {};
}

/**
 * Stand-in for the deterministic matcher (slice 3). It counts how many of the
 * compared fields disagree across the four records - name, date of birth and
 * parent name - because a mismatch on any one of them is a rejection. The real
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
export async function listMembersWithService(): Promise<
  (MemberRow & { service: ServiceRow[]; caseFacts: CaseFacts | null })[]
> {
  // The saved case facts come along too. Without them the picker re-derives from
  // the member row and always shows a member's ORIGINAL day count, while their
  // dashboard shows the current one - the same person reading as 8 days on one
  // screen and 3 on the next.
  return query<MemberRow & { service: ServiceRow[]; caseFacts: CaseFacts | null }>(
    `select m.*, coalesce(
       (select json_agg(json_build_object(
          'uan', s.uan, 'employer_name', s.employer_name,
          'from_date', s.from_date, 'to_date', s.to_date,
          'eps_months', s.eps_months))
        from service_history s where s.member_id = m.id), '[]'::json) as service,
       (select c.facts from cases c where c.member_id = m.id
         order by c.created_at desc limit 1) as "caseFacts"
     from members m
     -- Ravi leads on purpose: four employers, a second UAN, no exit date and
     -- three mismatched fields, so the first case anyone opens is the one that
     -- shows the most of what this does
     order by (m.slug <> 'ravi'), m.scenario desc, m.slug`,
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

  const blockingMismatches = countBlockingMismatches(documentsFor(member.slug, member.documents));

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

  /*
   * The one case where nothing is wrong.
   *
   * Every other demo member is stuck on something correctable. This one has all
   * seven checks green, filed the claim, and then nothing happened - which is a
   * different failure with a different remedy, and the only way to open the
   * grievance ladder on a case that has no blockers to clear. The claim is
   * back-dated so the 20-day settlement target has already passed.
   */
  if (member.scenario === 'stuck' && r.blockingCount === 0) {
    const reference = `SG-${randomUUID().slice(0, 8).toUpperCase()}`;
    await query(
      `update cases set claim_status = 'submitted', claim_reference = $1,
         claim_submitted_at = now() - interval '34 days', updated_at = now()
       where id = $2`,
      [reference, caseId],
    );
    await query(
      `insert into events (case_id, type, payload, days_remaining) values ($1,$2,$3,$4)`,
      [caseId, 'mock_claim_submitted', { reference }, r.totalDays],
    );
  }

  await seedFirstRung(caseId);

  return caseId;
}

/**
 * Deduped for the render pass. The dashboard layout and the page inside it both
 * need the case; without this they each issue the same query, doubling the cost
 * of every screen.
 */

/**
 * A blank-slate profile for exploring the product: a name, three employers, and
 * a couple of realistic, fixable problems. Everything - the member, its
 * synthesized documents, and the service history - is written to the database,
 * so the new case behaves exactly like a seeded one and survives a refresh.
 */
export interface NewProfileInput {
  name: string;
  dob?: string;
  employer?: string;
  joined?: string;
}

export async function createOwnProfile(input: NewProfileInput | string): Promise<string> {
  const i: NewProfileInput = typeof input === 'string' ? { name: input } : input;
  const name = (i.name || 'New Member').trim().replace(/\s+/g, ' ').slice(0, 60);
  const upper = name.toUpperCase();
  const slug = `you-${randomUUID().slice(0, 6)}`;
  const uan = `1${Math.floor(1e11 + Math.random() * 8e11)}`.slice(0, 12);
  const parts = upper.split(' ');
  const father = `${parts[0] === 'NEW' ? 'RAMESH' : 'RAJESH'} ${parts.at(-1) ?? 'KUMAR'}`;

  // one deliberate mismatch: EPFO holds an initialled version of the name, the
  // classic cause of rejection. Everything else agrees, so Record Health has
  // exactly one thing to fix.
  const epfoName =
    parts.length > 1 ? `${parts[0]} ${parts.slice(1).map((w) => w[0]).join(' ')}` : upper;
  const dob = i.dob || '1992-06-18';
  const documents = {
    aadhaar: { script: 'latin', name: upper, dob, father_name: father, id_number: '0000 0000 0000', gender: 'NA', address: 'Synthetic address' },
    pan: { script: 'latin', name: upper, dob, father_name: father, id_number: 'ZZZZZ0000Z' },
    bank: { script: 'latin', name: upper, name_native: upper, dob, father_name: father, bank_name: 'Demo Bank of India', account_number: '0000 0000 0000', ifsc: 'DEMO0000000' },
    epfo: { script: 'latin', name: epfoName, dob, father_name: father, id_number: uan },
  };

  const member = await one<MemberRow>(
    `insert into members (uan, demo_password, display_name, slug, scenario, headline,
       epfo_name, epfo_dob, epfo_father_name, date_of_joining, date_of_exit,
       employer_name, employer_responsive, eps_service_months, balance_paise,
       uan_active, e_nomination_filed, aadhaar_linked, documents)
     values ($1,'--',$2,$3,'explore',$4,$5,$6,$7,$8,null,$9,true,$10,$11,true,false,true,$12)
     returning *`,
    [
      uan, name, slug,
      'A profile you set up - clean apart from a name that reads differently on EPFO, no exit date, and no nomination',
      epfoName, dob, father, i.joined || '2021-04-05', (i.employer || 'Meridian Services Pvt Ltd').slice(0, 80), 78, 41_00_00 * 100,
      JSON.stringify(documents),
    ],
  );
  const memberId = member!.id;

  const currentEmp = (i.employer || 'Meridian Services Pvt Ltd').slice(0, 80);
  const currentJoined = i.joined || '2021-04-05';
  const jobs: [string, string, string | null, number][] = [
    [currentEmp, currentJoined, null, 41],
    ['Harbour Tech Solutions', '2018-08-01', '2021-03-20', 31],
    ['First Step Retail Ltd', '2016-06-15', '2018-07-10', 25],
  ];
  for (const [emp, from, to, mo] of jobs) {
    await query(
      `insert into service_history (member_id, uan, employer_name, from_date, to_date, eps_months)
       values ($1,$2,$3,$4,$5,$6)`,
      [memberId, uan, emp, from, to, mo],
    );
  }

  return (await startCase(slug))!;
}

export const loadCase = cache(async (caseId: string): Promise<CaseView | null> => {
  // case, member and event history in a single round trip. Three separate
  // queries cost ~700ms from here; this costs ~230ms.
  const row = await one<{
    facts: CaseFacts;
    member: MemberRow;
    service: ServiceRow[];
    history: CaseEvent[];
    claim_status: 'not_submitted' | 'submitted' | null;
    claim_reference: string | null;
    claim_submitted_at: string | null;
  }>(
    `select c.facts, c.claim_status, c.claim_reference, c.claim_submitted_at,
            to_jsonb(m.*) as member,
            coalesce((
              select json_agg(json_build_object(
                       'uan', s.uan, 'employer_name', s.employer_name,
                       'from_date', s.from_date, 'to_date', s.to_date,
                       'eps_months', s.eps_months)
                     order by s.from_date desc)
                from service_history s where s.member_id = m.id), '[]'::json) as service,
            coalesce((
              select json_agg(json_build_object(
                       'type', e.type, 'payload', e.payload,
                       'days_remaining', e.days_remaining, 'at', e.at)
                     order by e.id desc)
                from (select id, type, payload, days_remaining, at
                        from events where case_id = c.id
                       order by id desc limit 60) e
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
    documents: documentsFor(row.member.slug, (row.member as { documents?: unknown }).documents),
    service: row.service ?? [],
    history,
    claimStatus: row.claim_status ?? 'not_submitted',
    claimReference: row.claim_reference ?? null,
    claimSubmittedAt: row.claim_submitted_at ?? null,
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

/** Record the final step in the demo: a mocked hand-off to EPFO's claim form. */
export async function submitMockClaim(caseId: string): Promise<string | null> {
  const row = await one<{ facts: CaseFacts; claim_status: string }>(
    `select facts, claim_status from cases where id = $1`,
    [caseId],
  );
  if (!row || row.claim_status === 'submitted') return null;
  const resolution = resolve(SPEC, row.facts);
  if (resolution.gates.some((g) => g.status === 'red' || g.status === 'blocked')) return null;

  const reference = `SG-${randomUUID().slice(0, 8).toUpperCase()}`;
  await query(
    `update cases set claim_status = 'submitted', claim_reference = $1,
       claim_submitted_at = now(), updated_at = now() where id = $2`,
    [reference, caseId],
  );
  await query(
    `insert into events (case_id, type, payload, days_remaining) values ($1,$2,$3,$4)`,
    [caseId, 'mock_claim_submitted', { reference }, resolution.totalDays],
  );
  return reference;
}


/**
 * Put every example back to how it started.
 *
 * Reviewers share one database, and startCase reuses a member's existing case
 * rather than creating a new one, so whatever the last person cleared is what the
 * next person sees. Resetting per-case would cost seven round trips each; this
 * does the whole set in a handful by batching the writes.
 */
export async function resetAllCases(): Promise<number> {
  const rows = await query<{
    case_id: string;
    member: MemberRow;
    service: ServiceRow[];
  }>(
    `select c.id as case_id,
            to_jsonb(m.*) as member,
            coalesce((
              select json_agg(json_build_object(
                       'uan', s.uan, 'employer_name', s.employer_name,
                       'from_date', s.from_date, 'to_date', s.to_date,
                       'eps_months', s.eps_months))
                from service_history s where s.member_id = m.id), '[]'::json) as service
       from cases c join members m on m.id = c.member_id`,
  );
  if (rows.length === 0) return 0;

  const payload = rows.map((r) => {
    const facts = deriveFacts(
      r.member,
      r.service ?? [],
      countBlockingMismatches(documentsFor(r.member.slug, r.member.documents)),
      intakeFor(r.member.slug),
    );
    return { case_id: r.case_id, facts, days: resolve(SPEC, facts).totalDays };
  });

  const ids = payload.map((p) => p.case_id);

  await query(
    `update cases c set facts = x.facts, claim_status = 'not_submitted',
       claim_reference = null, claim_submitted_at = null, updated_at = now()
       from jsonb_to_recordset($1::jsonb) as x(case_id uuid, facts jsonb)
      where c.id = x.case_id`,
    [JSON.stringify(payload.map((p) => ({ case_id: p.case_id, facts: p.facts })))],
  );
  await query(`delete from events where case_id = any($1::uuid[])`, [ids]);
  // requests sent to employers belong to the run that sent them; leaving them
  // behind made a reset case still claim its employer had already acted
  await query(`delete from employer_requests where case_id = any($1::uuid[])`, [ids]);
  await query(`delete from gate_states where case_id = any($1::uuid[])`, [ids]);

  for (const p of payload) {
    await persistGateStates(p.case_id, resolve(SPEC, p.facts));
  }

  await query(
    `insert into events (case_id, type, payload, days_remaining)
     select x.case_id, 'case_opened', '{}'::jsonb, x.days
       from jsonb_to_recordset($1::jsonb) as x(case_id uuid, days int)`,
    [JSON.stringify(payload.map((p) => ({ case_id: p.case_id, days: p.days })))],
  );

  return payload.length;
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
    countBlockingMismatches(documentsFor(member.slug, member.documents)),
    intakeFor(member.slug),
  );

  await query(`update cases set facts = $1, claim_status = 'not_submitted', claim_reference = null, claim_submitted_at = null, updated_at = now() where id = $2`, [facts, caseId]);
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

// ------------------------------------------------------------- escalation

/**
 * Record a simulated filing on the grievance ladder.
 *
 * Nothing leaves this machine. The reference number is generated here and the
 * row lands in the same events table every other case action uses, so the
 * ladder's state is derived from the log rather than held in a column that can
 * drift out of step with it.
 */
export async function fileGrievance(caseId: string, rung: string): Promise<string | null> {
  const row = await one<{ claim_status: string }>(
    `select claim_status from cases where id = $1`,
    [caseId],
  );
  if (!row) return null;

  const already = await one<{ n: string }>(
    `select count(*)::text as n from events
      where case_id = $1 and type = 'grievance_filed' and payload->>'rung' = $2`,
    [caseId, rung],
  );
  if (already && Number(already.n) > 0) return null;

  const reference = `${rung === 'rti' ? 'RTI' : 'GRV'}-${randomUUID().slice(0, 8).toUpperCase()}`;
  await query(
    `insert into events (case_id, type, payload, days_remaining) values ($1,$2,$3,null)`,
    [caseId, 'grievance_filed', { rung, reference }],
  );
  return reference;
}

/**
 * Advance the demo clock and let the grievance come back the way they usually do.
 *
 * This is the honest bit. Simulating a government system working is easy and
 * teaches nobody anything; what actually happens to most grievances is a
 * disposal that closes the ticket without answering the question. So that is
 * what the simulation does, and the product then has to deal with it.
 */
export async function simulateDisposal(
  caseId: string,
  rung: string,
  dayCount: number,
  disposalText: string,
): Promise<void> {
  const filed = await one<{ n: string }>(
    `select count(*)::text as n from events
      where case_id = $1 and type = 'grievance_filed' and payload->>'rung' = $2`,
    [caseId, rung],
  );
  if (!filed || Number(filed.n) === 0) return;

  const done = await one<{ n: string }>(
    `select count(*)::text as n from events
      where case_id = $1 and type = 'grievance_disposed' and payload->>'rung' = $2`,
    [caseId, rung],
  );
  if (done && Number(done.n) > 0) return;

  await query(
    `insert into events (case_id, type, payload, days_remaining) values ($1,$2,$3,null)`,
    [caseId, 'grievance_disposed', { rung, dayCount, disposalText }],
  );
}

/**
 * Start every case one rung up the ladder.
 *
 * EPFiGMS is EPFO's own grievance desk: same organisation, same login, and the
 * step a member finds unaided. Seeding it as already filed and already disposed
 * puts the case where the product actually has something to say - at the jump
 * into CPGRAMS, which is a different department's portal and the part nobody
 * makes easy. The disposal text is the one these grievances really come back
 * with, so the demo opens on the failure rather than on a blank ladder.
 */
export async function seedFirstRung(caseId: string): Promise<void> {
  const existing = await one<{ n: string }>(
    `select count(*)::text as n from events
      where case_id = $1 and type = 'grievance_filed' and payload->>'rung' = $2`,
    [caseId, SEEDED_RUNG],
  );
  if (existing && Number(existing.n) > 0) return;

  const reference = `GRV-${randomUUID().slice(0, 8).toUpperCase()}`;
  await query(
    `insert into events (case_id, type, payload, days_remaining) values ($1,$2,$3,null)`,
    [caseId, 'grievance_filed', { rung: SEEDED_RUNG, reference }],
  );
  await query(
    `insert into events (case_id, type, payload, days_remaining) values ($1,$2,$3,null)`,
    [
      caseId,
      'grievance_disposed',
      { rung: SEEDED_RUNG, dayCount: 30, disposalText: TYPICAL_DISPOSAL },
    ],
  );
}
