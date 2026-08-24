import type { CaseView } from './case';
import type { ServiceRow } from './gates/facts';

/**
 * Everything the dashboard panels show, derived from one case.
 *
 * The point of these panels is not more screens — it is answering "where did
 * this break in the first place". So every figure here traces back to a real
 * field on the member, the service history, or the four uploaded records.
 * Anything estimated is labelled as such and never dressed up as a fact.
 */

const rupee = (paise: number) => Math.round(paise / 100);
export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const monthsToYM = (m: number) => {
  const y = Math.floor(m / 12);
  const mo = m % 12;
  if (y && mo) return `${y} yr ${mo} mo`;
  if (y) return `${y} yr`;
  return `${mo} mo`;
};

const fmtDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'present';

// ---------------------------------------------------------------- employment

export interface Employer {
  name: string;
  uan: string;
  from: string;
  to: string | null;
  months: number;
  isCurrent: boolean;
  /** true when this employment sits under a different UAN than the primary one */
  onSecondUan: boolean;
  /** whole months of unexplained gap before this job started */
  gapBefore: number;
  /** the current job with no recorded last-working-day */
  exitMissing: boolean;
}

export function employment(c: CaseView): { primaryUan: string; rows: Employer[] } {
  const primaryUan = c.member.uan;
  const sorted = [...c.service].sort(
    (a, b) => new Date(a.from_date).valueOf() - new Date(b.from_date).valueOf(),
  );

  const rows: Employer[] = sorted.map((s, i) => {
    const prev = sorted[i - 1];
    const gapBefore = prev?.to_date ? gapMonths(prev.to_date, s.from_date) : 0;
    const isCurrent = s.to_date === null;
    return {
      name: s.employer_name ?? 'Employer',
      uan: s.uan,
      from: s.from_date,
      to: s.to_date,
      months: s.eps_months,
      isCurrent,
      onSecondUan: s.uan !== primaryUan,
      gapBefore,
      exitMissing: isCurrent && !c.facts.exitMarked && !c.facts.stillEmployed,
    };
  });

  return { primaryUan, rows: rows.reverse() }; // newest first for display
}

function gapMonths(a: string, b: string): number {
  const from = new Date(a);
  const to = new Date(b);
  let m = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) m -= 1;
  return Math.max(0, m);
}

// -------------------------------------------------------- the transfer story

export interface TransferStory {
  fromEmployer: string;
  toEmployer: string;
  employerCount: number;
  totalService: number;
  /** the mistakes that crept in along the way, oldest first */
  mistakes: { where: string; what: string }[];
}

export function transferStory(c: CaseView): TransferStory {
  const { rows } = employment(c);
  const chronological = [...rows].reverse();
  const current = rows[0];
  const oldest = chronological[0];

  const mistakes: TransferStory['mistakes'] = [];

  for (const r of chronological) {
    if (r.onSecondUan)
      mistakes.push({
        where: r.name,
        what: 'A second UAN was created here, splitting your record in two.',
      });
    if (r.gapBefore > 0)
      mistakes.push({
        where: r.name,
        what: `A ${monthsToYM(r.gapBefore)} gap in contributions sits just before this job.`,
      });
    if (r.exitMissing)
      mistakes.push({
        where: r.name,
        what: 'Your last working day was never marked, so EPFO still thinks you work here.',
      });
  }

  if (c.facts.blockingMismatches > 0)
    mistakes.push({
      where: 'Across your records',
      what: `${c.facts.blockingMismatches} of your details (name, date of birth or parent name) disagree between Aadhaar, PAN, bank and EPFO.`,
    });

  return {
    fromEmployer: oldest?.name ?? '—',
    toEmployer: current?.name ?? '—',
    employerCount: rows.length,
    totalService: c.facts.totalEpsServiceMonths,
    mistakes,
  };
}

// ------------------------------------------------------------ record health

export interface FieldRow {
  field: string;
  values: { source: string; value: string; agrees: boolean }[];
  agree: boolean;
  winner: string;
}

const SOURCES = ['aadhaar', 'pan', 'bank', 'epfo'] as const;
const SOURCE_LABEL: Record<string, string> = {
  aadhaar: 'Aadhaar',
  pan: 'PAN',
  bank: 'Bank',
  epfo: 'EPFO',
};

export function recordHealth(c: CaseView): FieldRow[] {
  const fields: [string, string][] = [
    ['Name', 'name'],
    ['Date of birth', 'dob'],
    ["Parent's name", 'father_name'],
  ];

  // Once the records gate is cleared the corrections have been made, so the
  // fields agree even though the original uploaded documents still differ. This
  // keeps Record Health consistent with the countdown and every other panel,
  // all of which read the same resolved fact.
  const resolved = c.facts.blockingMismatches === 0;

  return fields.map(([label, key]) => {
    const raw = SOURCES.map((src) => ({
      source: SOURCE_LABEL[src],
      value: String((c.documents[src]?.[key] as string) ?? '—'),
    })).filter((v) => v.value !== '—');

    // Aadhaar is EPFO's source of truth, so it is the reference every other
    // record has to match.
    const truth = raw.find((v) => v.source === 'Aadhaar')?.value ?? raw[0]?.value ?? '';
    const norm = (s: string) => s.toUpperCase().replace(/\s+/g, ' ').trim();
    const values = raw.map((v) => ({
      ...v,
      // after correction, everything reads as the Aadhaar value
      value: resolved ? truth : v.value,
      agrees: resolved || norm(v.value) === norm(truth),
    }));

    return {
      field: label,
      values,
      agree: values.every((v) => v.agrees),
      winner: 'Aadhaar',
    };
  });
}

// -------------------------------------------------------------------- money

export interface MoneySummary {
  balance: number;
  /** rough monthly contribution, balance spread over service — an illustration */
  monthlyEstimate: number;
  epfShareNote: string;
}

export function money(c: CaseView): MoneySummary {
  const balance = c.facts.balanceRupees;
  const months = Math.max(1, c.facts.totalEpsServiceMonths);
  return {
    balance,
    monthlyEstimate: Math.round(balance / months),
    epfShareNote:
      'This is your EPF savings pot. Your pension (EPS) is a separate entitlement, tracked under Pension below.',
  };
}

// --------------------------------------------------------------- eps/pension

export interface PensionStatus {
  serviceMonths: number;
  yearsLabel: string;
  /** the 10-year line: below it EPS is a lump sum, at or above it becomes a pension */
  crossedTenYears: boolean;
  monthsToTenYears: number;
  ageNow: number | null;
  yearsToPension: number | null;
}

export function pension(c: CaseView): PensionStatus {
  const m = c.facts.totalEpsServiceMonths;
  const dob = c.member.epfo_dob ? new Date(c.member.epfo_dob) : null;
  const ageNow = dob ? Math.floor((Date.now() - dob.valueOf()) / (365.25 * 864e5)) : null;

  return {
    serviceMonths: m,
    yearsLabel: monthsToYM(m),
    crossedTenYears: m >= 120,
    monthsToTenYears: Math.max(0, 120 - m),
    ageNow,
    yearsToPension: ageNow === null ? null : Math.max(0, 58 - ageNow),
  };
}

// -------------------------------------------------------------------- alerts

export interface Alert {
  severity: 'blocking' | 'warning' | 'info' | 'good';
  title: string;
  detail: string;
  /** which gate to open, if any */
  gateId?: string;
}

export function alerts(c: CaseView): Alert[] {
  const out: Alert[] = [];
  const f = c.facts;

  if (f.blockingMismatches > 0)
    out.push({
      severity: 'blocking',
      title: 'Your records disagree with each other',
      detail: `${f.blockingMismatches} field${f.blockingMismatches === 1 ? '' : 's'} differ across Aadhaar, PAN, bank and EPFO. Any claim will be rejected until they match.`,
      gateId: 'records_agree',
    });

  if (f.distinctUanCount > 1)
    out.push({
      severity: 'blocking',
      title: 'You have more than one UAN',
      detail: 'Your service is split across two UANs, which shortens your pension record. They must be merged.',
      gateId: 'service_history',
    });

  if (!f.exitMarked && !f.stillEmployed)
    out.push({
      severity: 'warning',
      title: 'No exit date on your last job',
      detail: 'Until your last working day is recorded, EPFO treats you as still employed and will not release a withdrawal.',
      gateId: 'exit_marked',
    });

  if (f.serviceGapMonths > 0)
    out.push({
      severity: 'warning',
      title: `A ${monthsToYM(f.serviceGapMonths)} gap in your contributions`,
      detail: 'A break with no employer against it reduces your pensionable service. Worth confirming it is genuine.',
      gateId: 'service_history',
    });

  if (!f.uanActive)
    out.push({
      severity: 'blocking',
      title: 'Your UAN is not activated',
      detail: 'Nothing online works until you activate it through UMANG. This blocks everything else.',
      gateId: 'uan_active',
    });

  if (!f.eNominationFiled)
    out.push({
      severity: 'warning',
      title: 'No e-Nomination on file',
      detail: 'The claim page will not even open without one. It takes a day and is easy to miss.',
      gateId: 'e_nomination',
    });

  const p = pension(c);
  if (!p.crossedTenYears && p.monthsToTenYears <= 12 && p.monthsToTenYears > 0)
    out.push({
      severity: 'info',
      title: `You are ${monthsToYM(p.monthsToTenYears)} from 10 years of service`,
      detail: 'At ten years your pension stops being a withdrawable lump sum and becomes a monthly pension at 58. Worth deciding before you cross it.',
    });

  if (out.length === 0)
    out.push({
      severity: 'good',
      title: 'Nothing needs your attention',
      detail: 'Your records line up, your service is clean, and you are ready to file.',
    });

  return out;
}



// ------------------------------------------------------- contribution timeline

export interface MonthPoint {
  /** YYYY-MM */
  key: string;
  year: number;
  month: number;
  /** money added this month (0 during gaps / before first job) */
  added: number;
  /** running total after this month */
  cumulative: number;
  employer: string | null;
}

export interface ContributionTimeline {
  points: MonthPoint[];
  total: number;
  /** labelled ticks for the x-axis */
  yearTicks: { at: number; year: number }[];
  peakMonthly: number;
}

/**
 * A month-by-month build-up of the balance. The total balance is spread evenly
 * across the months you actually contributed (gaps add nothing), so the curve
 * climbs while you were employed and flattens when you were not — a faithful
 * shape even though EPFO does not publish a real per-month figure.
 */
export function contributionTimeline(c: CaseView): ContributionTimeline {
  const spans = [...c.service]
    .map((s) => ({
      employer: s.employer_name ?? 'Employer',
      from: new Date(s.from_date),
      to: s.to_date ? new Date(s.to_date) : new Date(),
    }))
    .filter((s) => !isNaN(s.from.valueOf()))
    .sort((a, b) => a.from.valueOf() - b.from.valueOf());

  if (spans.length === 0)
    return { points: [], total: c.facts.balanceRupees, yearTicks: [], peakMonthly: 0 };

  const start = new Date(spans[0].from.getFullYear(), spans[0].from.getMonth(), 1);
  const endSpan = spans.reduce((a, b) => (b.to > a ? b.to : a), spans[0].to);
  const end = new Date(endSpan.getFullYear(), endSpan.getMonth(), 1);

  // which employer, if any, was active in a given month
  const employerAt = (d: Date): string | null => {
    for (const s of spans) if (d >= new Date(s.from.getFullYear(), s.from.getMonth(), 1) && d <= s.to) return s.employer;
    return null;
  };

  const months: { d: Date; employer: string | null }[] = [];
  for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
    months.push({ d: new Date(d), employer: employerAt(new Date(d)) });
  }

  const contributing = months.filter((m) => m.employer).length || 1;
  const perMonth = c.facts.balanceRupees / contributing;

  let cumulative = 0;
  const points: MonthPoint[] = months.map((m) => {
    const added = m.employer ? perMonth : 0;
    cumulative += added;
    return {
      key: `${m.d.getFullYear()}-${String(m.d.getMonth() + 1).padStart(2, '0')}`,
      year: m.d.getFullYear(),
      month: m.d.getMonth() + 1,
      added: Math.round(added),
      cumulative: Math.round(cumulative),
      employer: m.employer,
    };
  });

  const yearTicks: { at: number; year: number }[] = [];
  points.forEach((p, i) => {
    if (p.month === 1 || i === 0) {
      if (!yearTicks.some((t) => t.year === p.year)) yearTicks.push({ at: i, year: p.year });
    }
  });

  return { points, total: c.facts.balanceRupees, yearTicks, peakMonthly: Math.round(perMonth) };
}

// ------------------------------------------------------------------ pre-flight

export interface PreFlight {
  ready: boolean;
  blockingCount: number;
  totalDays: number;
  items: { label: string; ok: boolean; actor: string | null }[];
}

export function preFlight(c: CaseView): PreFlight {
  const items = c.resolution.gates
    .filter((g) => g.status !== 'not_applicable')
    .map((g) => ({
      label: g.title,
      ok: g.status === 'green',
      actor: g.actor,
    }));

  return {
    ready: c.resolution.blockingCount === 0,
    blockingCount: c.resolution.blockingCount,
    totalDays: c.resolution.totalDays,
    items,
  };
}

export { monthsToYM, fmtDate, rupee };
export type { ServiceRow };
