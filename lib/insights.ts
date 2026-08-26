import type { CaseView } from './case';
import type { ServiceRow } from './gates/facts';

/**
 * Everything the dashboard panels show, derived from one case.
 *
 * The point of these panels is not more screens - it is answering "where did
 * this break in the first place". So every figure here traces back to a real
 * field on the member, the service history, or the four uploaded records.
 * Anything estimated is labelled as such and never dressed up as a fact.
 */

const rupee = (paise: number) => Math.round(paise / 100);
/** "1st", "2nd", "3rd" - so a job can be named by its place in a working life. */
export const ordinal = (n: number) => {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
};

/** Drop values into a translated sentence: fill('{n} left', { n: '3' }). */
export const fill = (s: string, vars?: Record<string, string>) =>
  vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;

export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const monthsToYM = (m: number) => {
  const y = Math.floor(m / 12);
  const mo = m % 12;
  if (y && mo) return `${y} yr ${mo} mo`;
  if (y) return `${y} yr`;
  return `${mo} mo`;
};

/**
 * The same span, written out. "1 mo" belongs in a stat tile where space is the
 * constraint; in the middle of a sentence it reads like an abbreviation someone
 * forgot to finish.
 */
export const monthsInWords = (m: number, t: (s: string) => string = (x) => x) => {
  const y = Math.floor(m / 12);
  const mo = m % 12;
  const parts: string[] = [];
  // the unit words go through the dictionary too - a Hindi sentence with
  // "7 months" sitting in the middle of it is not a translated sentence
  if (y) parts.push(`${y} ${t(y === 1 ? 'year' : 'years')}`);
  if (mo) parts.push(`${mo} ${t(mo === 1 ? 'month' : 'months')}`);
  return parts.join(` ${t('and')} `) || `0 ${t('months')}`;
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
  /** where this sits in your working life, 1 being the first job you ever had */
  position: number;
  /**
   * How long the problem here has been sitting in your record, in months.
   *
   * This is the part nobody is ever told. A second account opened in 2019 is not
   * a thing that went wrong today - it has been quietly shortening your pension
   * for years, and the first anyone hears of it is the day the claim bounces.
   * Null when this job has no problem, or when the problem has no start date.
   */
  problemAgeMonths: number | null;
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
    const onSecondUan = s.uan !== primaryUan;
    // A split account dates from the day this job started; a gap dates from the
    // day the previous job ended. A missing exit date has no honest start date -
    // nobody recorded the day it should have begun - so it stays null.
    const startedAt = onSecondUan ? s.from_date : gapBefore > 0 ? prev.to_date : null;

    return {
      name: s.employer_name ?? 'Employer',
      uan: s.uan,
      from: s.from_date,
      to: s.to_date,
      months: s.eps_months,
      isCurrent,
      onSecondUan,
      gapBefore,
      exitMissing: isCurrent && !c.facts.exitMarked && !c.facts.stillEmployed,
      position: i + 1,
      problemAgeMonths: startedAt ? gapMonths(startedAt, today()) : null,
    };
  });

  return { primaryUan, rows: rows.reverse() }; // newest first for display
}

/** Today as YYYY-MM-DD, so ages are measured against the same clock everywhere. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
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
  /** what went wrong and where. `vars` fills {placeholders} after translation. */
  mistakes: { where: string; what: string; vars?: Record<string, string> }[];
}

export function transferStory(c: CaseView, t: (s: string) => string = (x) => x): TransferStory {
  const { rows } = employment(c);
  const chronological = [...rows].reverse();
  const current = rows[0];
  const oldest = chronological[0];

  const mistakes: TransferStory['mistakes'] = [];

  for (const r of chronological) {
    if (r.onSecondUan)
      mistakes.push({
        where: r.name,
        what: 'This company started you a brand-new PF account instead of using the one you already had. Your savings now sit in two separate accounts, and EPFO reads you as two different people. They have to be joined back into one before any money comes out.',
      });
    if (r.gapBefore > 0)
      mistakes.push({
        where: r.name,
        what: 'For {span} before this job, no money went into your PF at all. EPFO does not know why. Those months do not count towards your pension, so it is worth saying whether you were between jobs or your employer simply stopped paying.',
        vars: { span: monthsInWords(r.gapBefore, t) },
      });
    if (r.exitMissing)
      mistakes.push({
        where: r.name,
        what: 'Nobody ever told EPFO the day you left. As far as their records go you still work here, and they will not hand over your savings while you are employed. Your old company has to enter that date.',
      });
  }

  if (c.facts.blockingMismatches > 0)
    mistakes.push({
      where: 'Across your records',
      what: "Your name, date of birth or parent's name is written differently on some of your records. EPFO matches these letter by letter, so even one spelling difference sends the claim back. {n} of them do not match today.",
      vars: { n: String(c.facts.blockingMismatches) },
    });

  return {
    fromEmployer: oldest?.name ?? '-',
    toEmployer: current?.name ?? '-',
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
      value: String((c.documents[src]?.[key] as string) ?? '-'),
    })).filter((v) => v.value !== '-');

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
  /** rough monthly contribution, balance spread over service - an illustration */
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
  /** a second sentence, translated on its own */
  more?: string;
  /** fills {placeholders} in `title` after translation */
  titleVars?: Record<string, string>;
  /** fills {placeholders} in `detail` after translation */
  vars?: Record<string, string>;
  severity: 'blocking' | 'warning' | 'info' | 'good';
  title: string;
  detail: string;
  /** which gate to open, if any */
  gateId?: string;
}

export function alerts(c: CaseView, t: (s: string) => string = (x) => x): Alert[] {
  const out: Alert[] = [];
  const f = c.facts;

  if (f.blockingMismatches > 0)
    out.push({
      severity: 'blocking',
      title: 'Your name or details are written differently in different places',
      detail:
        '{n} of your details are written differently across your Aadhaar, PAN, bank account and EPFO record. A computer compares them letter by letter, so the claim will keep coming back until all four say exactly the same thing.',
      vars: { n: String(f.blockingMismatches) },
      gateId: 'records_agree',
    });

  if (f.distinctUanCount > 1)
    out.push({
      severity: 'blocking',
      title: 'Your savings are split across two accounts',
      detail: 'At some point a second PF account was opened for you instead of using your first one. EPFO counts each separately, so you are credited with fewer years than you actually worked. The two have to be joined into one.',
      gateId: 'service_history',
    });

  if (!f.exitMarked && !f.stillEmployed)
    out.push({
      severity: 'warning',
      title: 'EPFO still thinks you are working',
      detail: 'Nobody entered the day you left your last job. EPFO does not give savings to someone who is still employed, so this has to be recorded before anything else can happen.',
      gateId: 'exit_marked',
    });

  if (f.serviceGapMonths > 0)
    out.push({
      severity: 'warning',
      title: '{span} where nothing went into your PF',
      titleVars: { span: monthsInWords(f.serviceGapMonths, t) },
      detail:
        'For that time no money went into your PF and no employer is named. It does not count towards your pension. Worth checking whether you were genuinely between jobs, or an employer stopped paying without telling you.',
      gateId: 'service_history',
    });

  if (!f.uanActive)
    out.push({
      severity: 'blocking',
      title: 'Your PF account has not been switched on yet',
      detail: 'Your PF number exists but has never been activated, so nothing online will open for you. You do this yourself on the UMANG app using your face and your Aadhaar. Everything else waits on this one.',
      gateId: 'uan_active',
    });

  if (!f.eNominationFiled)
    out.push({
      severity: 'warning',
      title: 'You have not said who should receive this money',
      detail: 'EPFO asks everyone to name the family member who should get their savings if something happens to them. Until you do, the claim page will not open at all. It takes about a day and is easy to miss.',
      gateId: 'e_nomination',
    });

  const p = pension(c);
  if (!p.crossedTenYears && p.monthsToTenYears <= 12 && p.monthsToTenYears > 0)
    out.push({
      severity: 'info',
      title: 'You are {span} away from 10 years of service',
      titleVars: { span: monthsInWords(p.monthsToTenYears, t) },
      detail: 'Before ten years of service you can take your pension money out as one payment. After ten years you cannot, and instead you receive a monthly pension once you turn 58. Neither is wrong, but it is worth choosing on purpose rather than by accident.',
    });

  /**
   * Everything above is hand-written, which is why it reads well - and why it
   * used to be incomplete. There was no alert for the claim form or the 15G
   * attachment, so a member whose only remaining blocker was one of those saw
   * "1 still blocking" on the pre-flight badge and an empty Needs-your-attention
   * list underneath it. Two sources of truth, disagreeing on screen.
   *
   * The gates are the source of truth. Anything still in the way that the copy
   * above did not already cover gets an alert generated from the gate itself, so
   * the list cannot be missing something the countdown is counting.
   */
  const covered = new Set(out.map((a) => a.gateId).filter(Boolean));
  for (const g of c.resolution.gates) {
    if (g.status !== 'red' && g.status !== 'blocked') continue;
    if (covered.has(g.id)) continue;
    out.push({
      severity: g.status === 'red' ? 'blocking' : 'warning',
      title: g.problem,
      detail: g.blocks,
      // kept separate rather than glued on: a sentence built by concatenation
      // can never match a dictionary key, so the whole alert stayed in English
      more:
        g.status === 'blocked'
          ? 'You cannot start this one until the steps it depends on are cleared.'
          : undefined,
      gateId: g.id,
    });
  }

  // most costly first, so the thing worth doing today is at the top
  const RANK = { blocking: 0, warning: 1, info: 2, good: 3 } as const;
  out.sort((a, b) => {
    const bySeverity = RANK[a.severity] - RANK[b.severity];
    if (bySeverity !== 0) return bySeverity;
    // within a severity, whatever is actually on the critical path comes first
    const crit = (x: Alert) =>
      x.gateId && c.resolution.gates.find((g) => g.id === x.gateId)?.onCriticalPath ? 0 : 1;
    return crit(a) - crit(b);
  });

  if (out.length === 0)
    out.push({
      severity: 'good',
      title: 'Nothing needs your attention',
      detail: 'Everything matches, your work history is complete, and there is nothing stopping you from asking for your money.',
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
 * climbs while you were employed and flattens when you were not - a faithful
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
