import type { CaseFacts } from './types';

export interface MemberRecord {
  uan: string;
  uan_active: boolean;
  aadhaar_linked: boolean;
  e_nomination_filed: boolean;
  date_of_exit: string | null;
  employer_responsive: boolean;
  eps_service_months: number;
  balance_paise: number;
}

export interface ServiceRow {
  uan: string;
  from_date: string;
  to_date: string | null;
  eps_months: number;
}

/** The five triage answers. Everything downstream is derived from these. */
export interface Intake {
  stillEmployed: boolean;
  formSelected: boolean;
  form15gAttached: boolean;
  errorFromClosedEmployer: boolean;
}

const DEFAULT_INTAKE: Intake = {
  stillEmployed: false,
  formSelected: false,
  form15gAttached: false,
  errorFromClosedEmployer: false,
};

export function deriveFacts(
  member: MemberRecord,
  service: ServiceRow[],
  blockingMismatches: number,
  intake: Partial<Intake> = {},
): CaseFacts {
  const i = { ...DEFAULT_INTAKE, ...intake };

  return {
    uanActive: member.uan_active,
    aadhaarLinked: member.aadhaar_linked,
    eNominationFiled: member.e_nomination_filed,
    exitMarked: member.date_of_exit !== null,
    stillEmployed: i.stillEmployed,

    blockingMismatches,

    distinctUanCount: new Set(service.map((s) => s.uan)).size,
    serviceGapMonths: totalGapMonths(service),
    continuousServiceMonths: member.eps_service_months,
    totalEpsServiceMonths: service.reduce((n, s) => n + s.eps_months, 0),
    balanceRupees: Math.round(member.balance_paise / 100),

    formSelected: i.formSelected,
    form15gAttached: i.form15gAttached,

    employerResponsive: member.employer_responsive,
    errorFromClosedEmployer: i.errorFromClosedEmployer,
  };
}

/**
 * Whole months of employment that no employer has claimed. EPFO reads these as
 * non-pensionable, which is how someone with eleven years of work is told they
 * have under ten. Overlaps are not gaps and are counted as zero here.
 */
export function totalGapMonths(service: ServiceRow[]): number {
  const spans = service
    .filter((s) => s.to_date !== null)
    .map((s) => ({ from: new Date(s.from_date), to: new Date(s.to_date!) }))
    .filter((s) => !isNaN(s.from.valueOf()) && !isNaN(s.to.valueOf()))
    .sort((a, b) => a.from.valueOf() - b.from.valueOf());

  if (spans.length < 2) return 0;

  let gap = 0;
  let reach = spans[0].to;
  for (const s of spans.slice(1)) {
    if (s.from > reach) gap += monthsBetween(reach, s.from);
    if (s.to > reach) reach = s.to;
  }
  return gap;
}

/**
 * Whole calendar months, not elapsed days over an average month length. The
 * three weeks between leaving one job and starting the next is how people
 * actually change jobs; counting it as a month of missing service would flag
 * every normal career as broken.
 */
function monthsBetween(a: Date, b: Date): number {
  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) months -= 1;
  return Math.max(0, months);
}
