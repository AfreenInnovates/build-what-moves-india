import type { CaseView } from './case';
import type { Provenance } from './gates/types';

/**
 * What withdrawing actually costs you, in pension.
 *
 * This is the question the real portal never asks and no other project in the
 * field can answer: not "how do I withdraw" but "should I". Ten years of
 * pensionable service earns a monthly pension for life from 58; below it, the
 * pension money is a one-time payment and the entitlement is gone. Withdrawing
 * at a job change instead of transferring resets the clock, so a person can work
 * for decades and never cross the line.
 *
 * Pure, like the resolver. Facts in, a consequence out - no I/O, no model. The
 * formula is public; every figure carries where it came from and its confidence,
 * so a projection is never dressed up as a promise.
 */

const CHECKED = '2026-09-03';
const p = (source: string, confidence: Provenance['confidence']): Provenance => ({
  source,
  sourcedAt: CHECKED,
  confidence,
});

/** EPS pensionable salary is capped here unless higher pension was opted for. */
export const EPS_WAGE_CAP = 15_000;
export const EPS_MIN_PENSION = 1_000;
export const EPS_MAX_PENSION = 7_500;
export const TEN_YEARS_MONTHS = 120;

export const PENSION_FORMULA = p(
  'EPS-95 monthly pension = pensionable salary × pensionable service ÷ 70, with pensionable salary capped at Rs 15,000 unless higher pension was opted for; floor about Rs 1,000, ceiling about Rs 7,500',
  'published',
);

export const TEN_YEAR_RULE = p(
  'EPS requires 10 years of pensionable service for a lifelong monthly pension from 58; below 10 years it can be taken once via Form 10C and no pension follows. Withdrawing rather than transferring at a job change resets the service count',
  'published',
);

/**
 * Monthly pension at a given number of pensionable-service months.
 *
 * Service of 20 years or more carries a statutory +2 year bonus. The result is
 * clamped to the published floor and ceiling. Assumes the wage cap, which is the
 * case for the large majority of members - a higher-pension member is a separate,
 * flagged calculation the demo does not claim to cover.
 */
export function monthlyPensionAt(serviceMonths: number): number {
  if (serviceMonths < TEN_YEARS_MONTHS) return 0;
  let years = serviceMonths / 12;
  if (years >= 20) years += 2;
  const raw = (EPS_WAGE_CAP * years) / 70;
  return Math.round(Math.min(EPS_MAX_PENSION, Math.max(EPS_MIN_PENSION, raw)));
}

export type Verdict =
  | 'already_pension' // past 10 years: EPS is a pension, withdrawing PF does not touch it
  | 'merge_first' // a split account is what keeps them under the line
  | 'withdraw_costs_pension' // withdrawing now forfeits a pension they could reach
  | 'withdraw_safe'; // far from the line with no near path; nothing to lose today

export interface PensionConsequence {
  creditedMonths: number;
  workedMonths: number;
  monthsToThreshold: number;
  crossedTenYears: boolean;
  /** months sitting under a second UAN, recoverable by merging */
  recoverableMonths: number;
  /** would merging the split account carry them across the 10-year line */
  crossesIfMerged: boolean;
  /** pension at their current credited service, 0 if under the line */
  monthlyPensionNow: number;
  /** pension if the split months are merged in */
  monthlyPensionIfMerged: number;
  /** pension projected to age 58 at the wage cap, when age is known */
  monthlyPensionAt58: number | null;
  verdict: Verdict;
  formula: Provenance;
  rule: Provenance;
}

export function pensionConsequence(c: CaseView): PensionConsequence {
  const primaryUan = c.member.uan;

  // Credited service is what EPFO counts today: months under the PRIMARY UAN
  // only. Months under a second UAN are stranded - they exist, they were worked,
  // but they do not count towards the ten-year line until the accounts are
  // merged. Reading the aggregate fact instead would double-count them against
  // the recoverable figure below and wrongly show a split member as already past
  // ten years, which is the exact opposite of their situation.
  const hasRows = c.service.length > 0;
  const credited = hasRows
    ? c.service.filter((s) => s.uan === primaryUan).reduce((sum, s) => sum + (s.eps_months ?? 0), 0)
    : c.facts.totalEpsServiceMonths;

  // months stranded under a different UAN - the thing a merge would recover
  const recoverable = c.service
    .filter((s) => s.uan !== primaryUan)
    .reduce((sum, s) => sum + (s.eps_months ?? 0), 0);

  const worked = credited + recoverable;
  const crossedTenYears = credited >= TEN_YEARS_MONTHS;
  const crossesIfMerged = !crossedTenYears && credited + recoverable >= TEN_YEARS_MONTHS;

  const dob = c.member.epfo_dob ? new Date(c.member.epfo_dob) : null;
  const ageNow = dob ? Math.floor((Date.now() - dob.valueOf()) / (365.25 * 864e5)) : null;
  // if they keep contributing to 58 at the cap - an illustration, clearly labelled
  const monthsTo58 = ageNow === null ? null : Math.max(0, (58 - ageNow) * 12);
  const projectedMonths = monthsTo58 === null ? null : worked + monthsTo58;

  let verdict: Verdict;
  if (crossedTenYears) verdict = 'already_pension';
  else if (crossesIfMerged) verdict = 'merge_first';
  else if (projectedMonths !== null && projectedMonths >= TEN_YEARS_MONTHS)
    verdict = 'withdraw_costs_pension';
  else verdict = 'withdraw_safe';

  return {
    creditedMonths: credited,
    workedMonths: worked,
    monthsToThreshold: Math.max(0, TEN_YEARS_MONTHS - credited),
    crossedTenYears,
    recoverableMonths: recoverable,
    crossesIfMerged,
    monthlyPensionNow: monthlyPensionAt(credited),
    monthlyPensionIfMerged: monthlyPensionAt(worked),
    monthlyPensionAt58: projectedMonths === null ? null : monthlyPensionAt(projectedMonths),
    verdict,
    formula: PENSION_FORMULA,
    rule: TEN_YEAR_RULE,
  };
}

// ------------------------------------------------------------ the passbook

/**
 * Why the passbook shows less than the salary slip.
 *
 * The single most-asked EPF question, and the portal answers it nowhere. Of the
 * employer's 12%, up to Rs 1,250 a month is diverted to EPS - a pension pot that
 * does not appear as growing, withdrawable balance. People see the gap and think
 * money is missing. It is not; it is in a different pot with different rules.
 */
export const EPS_MONTHLY_CAP = 1_250; // 8.33% of the Rs 15,000 wage cap

export interface PassbookBreakdown {
  /** the withdrawable EPF pot - what the passbook headline shows */
  epfBalance: number;
  /** rough EPS pot: the pension diversion accumulated over contributing months */
  epsPotEstimate: number;
  monthlyEpsDiversion: number;
  contributingMonths: number;
  interest: Provenance;
  split: Provenance;
}

// ------------------------------------------------------------------ TDS

/**
 * What tax gets cut if you withdraw now.
 *
 * The rule already lives in the attachments gate, but there it is a checkbox
 * ("is Form 15G attached"). Here it becomes the number that actually changes the
 * decision: withdraw before five years of continuous service, on a balance over
 * Rs 50,000, and TDS is deducted unless Form 15G is on file. Past five years it
 * never applies. This is the "what will I actually receive" half of the
 * pre-filing question, and like everything else it is computed, not guessed.
 */
export const FIVE_YEARS_MONTHS = 60;
export const TDS_THRESHOLD = 50_000;
export const TDS_RATE_PAN = 10; // percent, when PAN is on record
export const TDS_RATE_NO_PAN = 20; // percent, without PAN

export type TdsReason = 'exempt_five_years' | 'below_threshold' | 'exempt_15g' | 'will_be_cut';

export interface TdsAssessment {
  continuousMonths: number;
  /** months of continuous service still needed to reach the five-year exemption */
  monthsToExempt: number;
  balance: number;
  aboveThreshold: boolean;
  form15gFiled: boolean;
  ratePct: number;
  /** the deduction if withdrawn today - 0 when exempt */
  tdsAmount: number;
  netIfWithdrawNow: number;
  reason: TdsReason;
  provenance: Provenance;
}

export function withdrawalTds(c: CaseView): TdsAssessment {
  const months = c.facts.continuousServiceMonths;
  const balance = c.facts.balanceRupees;
  const aboveThreshold = balance >= TDS_THRESHOLD;
  const form15gFiled = c.facts.form15gAttached;

  // Order matters: five years clears it outright, then the threshold, then 15G.
  let reason: TdsReason;
  if (months >= FIVE_YEARS_MONTHS) reason = 'exempt_five_years';
  else if (!aboveThreshold) reason = 'below_threshold';
  else if (form15gFiled) reason = 'exempt_15g';
  else reason = 'will_be_cut';

  // PAN is on record for every member here, so the 10% rate applies. Without PAN
  // it would be 20%, which the interface says in words rather than computing a
  // second figure nobody in the demo would hit.
  const ratePct = TDS_RATE_PAN;
  const tdsAmount = reason === 'will_be_cut' ? Math.round((balance * ratePct) / 100) : 0;

  return {
    continuousMonths: months,
    monthsToExempt: Math.max(0, FIVE_YEARS_MONTHS - months),
    balance,
    aboveThreshold,
    form15gFiled,
    ratePct,
    tdsAmount,
    netIfWithdrawNow: balance - tdsAmount,
    reason,
    provenance: p(
      'Income Tax Act: TDS applies to EPF withdrawn before five years of continuous service on a taxable amount of Rs 50,000 or more, at 10% with PAN (20% without), unless Form 15G/15H is filed. Estimated on the full balance; the exact taxable portion is a little smaller',
      'published',
    ),
  };
}

export function passbookBreakdown(c: CaseView): PassbookBreakdown {
  const months = Math.max(0, c.facts.totalEpsServiceMonths);
  return {
    epfBalance: c.facts.balanceRupees,
    // EPS does not earn interest that shows to the member, so this is a plain
    // accumulation and is labelled an estimate wherever it appears.
    epsPotEstimate: months * EPS_MONTHLY_CAP,
    monthlyEpsDiversion: EPS_MONTHLY_CAP,
    contributingMonths: months,
    split: p(
      'Of the employer 12%, 8.33% (up to Rs 1,250/month at the Rs 15,000 wage cap) goes to EPS, which is a pension entitlement and not part of the withdrawable EPF balance',
      'published',
    ),
    interest: p(
      'EPF interest for a financial year is declared once and credited in one pass, backdated to 31 March; the passbook entry can lag the backend by weeks without any loss of interest',
      'published',
    ),
  };
}
