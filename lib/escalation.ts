import type { Provenance } from './gates/types';
import type { CaseEvent } from './case';

/**
 * What you do when the claim itself is not the problem.
 *
 * Every other gate in this product describes a record that can be corrected.
 * This is the other failure: nothing is wrong with your file, and it still does
 * not move. There is a real ladder for that - a grievance, then an appeal, then
 * an RTI - and almost nobody knows it exists or in what order the rungs unlock.
 *
 * The ladder itself is DATA, like the gate spec, for the same reason: the
 * deadlines are statutory or published, they change, and an unattributed number
 * about a legal deadline is worse than no number. Every rung carries where it
 * came from and when it was checked.
 *
 * Nothing here files anything. Every draft is generated for the member to copy,
 * download, and submit themselves on the real portal.
 */

const CHECKED = '2026-09-03';
const p = (source: string, confidence: Provenance['confidence']): Provenance => ({
  source,
  sourcedAt: CHECKED,
  confidence,
});

export type RungId = 'wait' | 'epfigms' | 'cpgrams' | 'cpgrams_appeal' | 'rti' | 'rpfc';

export interface Rung {
  id: RungId;
  step: number;
  /** the channel, named the way the member will find it */
  channel: string;
  /** where it physically is */
  where: string;
  /** the real portal, deep-linked. We hand over the words and send them there. */
  href: string | null;
  /** the clock that applies once this rung is used */
  clock: string;
  /** working with calendar days, because every one of these deadlines is calendar */
  deadlineDays: number | null;
  /** what has to have happened before this rung is worth using */
  unlockedWhen: string;
  provenance: Provenance;
}

export const LADDER: Rung[] = [
  {
    id: 'wait',
    step: 0,
    channel: 'Wait',
    where: 'Nothing to do yet',
    href: null,
    clock: 'A complete claim is targeted at 20 days',
    deadlineDays: 20,
    unlockedWhen: 'The claim has been filed and the clock has not run out',
    provenance: p(
      'EPF Scheme 2026 sets a 20-day settlement target for full claims, with penal interest on unjustified delay beyond it. Read as reported until the notification is checked directly',
      'reported',
    ),
  },
  {
    id: 'epfigms',
    step: 1,
    channel: 'File a grievance',
    where: 'EPFiGMS · epfigms.gov.in, UMANG app, or 14470',
    href: 'https://epfigms.gov.in/',
    clock: 'Disposal target commonly cited as 30 days, outer limit 60',
    deadlineDays: 30,
    unlockedWhen: 'The 20-day claim target has passed with no outcome',
    provenance: p(
      'EPFO grievance timelines are widely reported at 7-15 working days for routine matters and 30 days overall; EPFO does not publish a single binding figure',
      'reported',
    ),
  },
  {
    id: 'cpgrams',
    step: 2,
    channel: 'Escalate to CPGRAMS',
    where: 'pgportal.gov.in',
    href: 'https://pgportal.gov.in/',
    clock: '30-day appeal window opens once a grievance is disposed',
    deadlineDays: 30,
    unlockedWhen: 'No reply, or the grievance was disposed without resolving anything',
    provenance: p(
      'CPGRAMS is the central grievance system EPFO grievances escalate into; the 30-day appeal window follows disposal',
      'reported',
    ),
  },
  {
    id: 'cpgrams_appeal',
    step: 3,
    channel: 'Appeal to the Nodal Appellate Authority',
    where: 'CPGRAMS · appeal against the disposal',
    href: 'https://pgportal.gov.in/',
    clock: '30 days from the date of disposal',
    deadlineDays: 30,
    unlockedWhen: 'The grievance was closed with an answer that does not address the request',
    provenance: p(
      'CPGRAMS provides an appeal to a Nodal Appellate Authority within 30 days of disposal',
      'reported',
    ),
  },
  {
    id: 'rti',
    step: 4,
    channel: 'File an RTI',
    where: 'The field office CPIO',
    href: 'https://rtionline.gov.in/',
    clock: '30 days to reply; first appeal decided within 45',
    deadlineDays: 30,
    unlockedWhen: 'The appeal was ignored or rejected, and you need the record itself',
    provenance: p(
      'Right to Information Act 2005: section 7(1) sets 30 days for a reply, section 19 governs the first appeal',
      'published',
    ),
  },
  {
    id: 'rpfc',
    step: 5,
    channel: 'Write to the Regional PF Commissioner',
    where: 'Your regional office, in writing, citing everything above',
    href: null,
    clock: 'No published standard',
    deadlineDays: null,
    unlockedWhen: 'Everything above has been exhausted and is on the record',
    provenance: p(
      'Regional escalation is widely advised once the portal ladder is exhausted; no service standard is published for it',
      'estimate',
    ),
  },
];

export const rungById = (id: RungId) => LADDER.find((r) => r.id === id)!;

/** One filing on the ladder, as recorded in the events table. */
export interface Filing {
  rung: RungId;
  reference: string;
  /** simulated days since this was filed */
  dayCount: number;
  disposed: boolean;
  /** the reply, when there is one */
  disposalText: string | null;
}

export interface EscalationState {
  filings: Filing[];
  /** the rung a member can act on right now */
  nextRung: Rung | null;
  /** highest rung reached so far */
  reached: number;
  /** true once a disposal has come back without resolving anything */
  hasNonAnswer: boolean;
}

export const GRIEVANCE_FILED = 'grievance_filed';
export const GRIEVANCE_DISPOSED = 'grievance_disposed';

/**
 * The rung that is already behind you.
 *
 * EPFiGMS is EPFO's own grievance desk - the same organisation, the same login,
 * the same building. Every demo case starts with that one already filed and
 * already disposed, because it is the step a member reaches on their own and it
 * is not where this product adds anything. The interesting rung is the next one,
 * which lives in a different department's portal entirely.
 */
export const SEEDED_RUNG: RungId = 'epfigms';

export interface ClaimClock {
  filedAt: string;
  /** calendar days since the claim was filed */
  elapsed: number;
  /** the target the scheme sets */
  target: number;
  /** days past the target, 0 when still inside it */
  overdueBy: number;
  isOverdue: boolean;
}

/**
 * How long the claim has actually been sitting there.
 *
 * The countdown on the dashboard answers "how long until this is payable" and
 * stops at the settlement floor. It cannot answer "it is payable and nobody has
 * paid me", which is the only situation in which a grievance makes any sense.
 * That needs a clock that starts at the filing date and keeps going.
 */
export function claimClock(filedAt: string | null): ClaimClock | null {
  if (!filedAt) return null;
  const target = rungById('wait').deadlineDays ?? 20;
  const ms = Date.now() - new Date(filedAt).valueOf();
  const elapsed = Math.max(0, Math.floor(ms / 86_400_000));
  const overdueBy = Math.max(0, elapsed - target);
  return { filedAt, elapsed, target, overdueBy, isOverdue: overdueBy > 0 };
}

interface GrievancePayload {
  rung?: RungId;
  reference?: string;
  dayCount?: number;
  disposalText?: string;
}

/**
 * Rebuild the ladder's state from the case's own event log.
 *
 * Same discipline as the gates: the events are the facts, this is a pure
 * derivation over them, and no button press decides anything on its own.
 */
export function escalationState(history: CaseEvent[], claimFiled: boolean): EscalationState {
  const filings: Filing[] = [];

  /*
   * Two passes, deliberately, rather than one pass in chronological order.
   *
   * loadCase returns the event log newest-first, so a single pass met the
   * disposal before the filing it belongs to and silently dropped it - the
   * grievance stayed "waiting on a reply" forever with the disposal sitting in
   * the database. Collecting filings first and then applying disposals makes
   * this independent of whatever order the caller hands the log over in, which
   * is the property a pure derivation should have had in the first place.
   */
  for (const e of history) {
    const payload = (e.payload ?? {}) as GrievancePayload;
    if (e.type === GRIEVANCE_FILED && payload.rung && !filings.some((f) => f.rung === payload.rung)) {
      filings.push({
        rung: payload.rung,
        reference: payload.reference ?? '-',
        dayCount: 0,
        disposed: false,
        disposalText: null,
      });
    }
  }

  for (const e of history) {
    const payload = (e.payload ?? {}) as GrievancePayload;
    if (e.type !== GRIEVANCE_DISPOSED || !payload.rung) continue;
    const f = filings.find((x) => x.rung === payload.rung);
    if (!f) continue;
    f.disposed = true;
    f.dayCount = payload.dayCount ?? rungById(payload.rung).deadlineDays ?? 30;
    f.disposalText = payload.disposalText ?? null;
  }

  filings.sort((a, b) => rungById(a.rung).step - rungById(b.rung).step);

  const reached = filings.reduce((n, f) => Math.max(n, rungById(f.rung).step), 0);
  const hasNonAnswer = filings.some((f) => f.disposed);

  /*
   * You cannot appeal something you have not filed.
   *
   * `claimFiled` used to gate the whole ladder, on the reasoning that a
   * grievance about an unsubmitted claim is incoherent. That is true of a
   * grievance about the CLAIM - but not of the ladder itself, which is equally
   * the route when an employer will not act on a correction, and that is most
   * of these members. So the ladder is open to everyone; what changes is the
   * ground the draft is written on.
   */
  void claimFiled;
  let nextRung: Rung | null = null;
  if (filings.length === 0) {
    nextRung = rungById(SEEDED_RUNG);
  } else {
    const open = filings.find((f) => !f.disposed);
    // something is still out with them: the next move is to wait, not to pile on
    nextRung = open ? null : LADDER.find((r) => r.step === reached + 1) ?? null;
  }

  return { filings, nextRung, reached, hasNonAnswer };
}

/**
 * The reply a grievance most often comes back with.
 *
 * Kept here rather than generated, because the point of showing it is that it is
 * typical - a template answer that closes the ticket without doing anything. A
 * model writing a fresh one each time would undercut exactly that.
 */
export const TYPICAL_DISPOSAL =
  'Your grievance has been examined and forwarded to the concerned field office for necessary action. The claim is under process. You are advised to check the status on the member portal after some time. Grievance is hereby disposed of.';
