import { describe, it, expect } from 'vitest';
import {
  monthlyPensionAt,
  pensionConsequence,
  passbookBreakdown,
  withdrawalTds,
  EPS_MAX_PENSION,
  EPS_MONTHLY_CAP,
  TEN_YEARS_MONTHS,
  TDS_RATE_PAN,
} from './pension';
import type { CaseView } from './case';
import type { CaseFacts } from './gates/types';

const facts = (o: Partial<CaseFacts>): CaseFacts => ({
  uanActive: true,
  aadhaarLinked: true,
  eNominationFiled: true,
  exitMarked: true,
  stillEmployed: false,
  blockingMismatches: 0,
  distinctUanCount: 1,
  serviceGapMonths: 0,
  continuousServiceMonths: 0,
  totalEpsServiceMonths: 0,
  balanceRupees: 0,
  formSelected: true,
  form15gAttached: true,
  employerResponsive: true,
  errorFromClosedEmployer: false,
  ...o,
});

/** A minimal CaseView - only the fields pension.ts actually reads. */
const view = (o: {
  months: number;
  balance?: number;
  uan?: string;
  dob?: string | null;
  service?: { uan: string; eps_months: number }[];
}): CaseView =>
  ({
    member: { uan: o.uan ?? 'U1', epfo_dob: o.dob ?? null } as CaseView['member'],
    facts: facts({ totalEpsServiceMonths: o.months, balanceRupees: o.balance ?? 0 }),
    service: (o.service ?? []) as CaseView['service'],
  }) as CaseView;

describe('monthlyPensionAt', () => {
  it('is zero below ten years - it is not a pension yet', () => {
    expect(monthlyPensionAt(TEN_YEARS_MONTHS - 1)).toBe(0);
  });

  it('follows salary x service / 70 at the wage cap', () => {
    // 10 years at the 15,000 cap: 15000 * 10 / 70 = 2142.86 -> 2143
    expect(monthlyPensionAt(120)).toBe(2143);
  });

  it('adds the two-year bonus at twenty years of service', () => {
    // 20 years -> 22 credited: 15000 * 22 / 70 = 4714.28 -> 4714
    expect(monthlyPensionAt(240)).toBe(4714);
  });

  it('never exceeds the statutory ceiling', () => {
    expect(monthlyPensionAt(600)).toBe(EPS_MAX_PENSION);
  });
});

describe('pensionConsequence', () => {
  it('flags merge_first when a split account is what keeps them under the line', () => {
    // 8 years credited, 4 years stranded under a second UAN -> merging crosses 10
    const c = view({
      months: 96,
      uan: 'U1',
      service: [
        { uan: 'U1', eps_months: 96 },
        { uan: 'U2', eps_months: 48 },
      ],
    });
    const r = pensionConsequence(c);
    expect(r.recoverableMonths).toBe(48);
    expect(r.crossesIfMerged).toBe(true);
    expect(r.verdict).toBe('merge_first');
    // and the merge is the difference between no pension and a real one
    expect(r.monthlyPensionNow).toBe(0);
    expect(r.monthlyPensionIfMerged).toBeGreaterThan(0);
  });

  it('counts only primary-UAN months as credited when the aggregate already includes the stranded ones', () => {
    // Ravi's real shape: the aggregate fact (129) already sums every UAN, but
    // credited service is the primary UAN alone (100). Reading the aggregate
    // would double-count the stranded 29 and wrongly report him past ten years -
    // the exact bug this guards against.
    const c = view({
      months: 129, // totalEpsServiceMonths, all UANs
      uan: 'U1',
      service: [
        { uan: 'U1', eps_months: 46 },
        { uan: 'U2', eps_months: 29 }, // stranded
        { uan: 'U1', eps_months: 23 },
        { uan: 'U1', eps_months: 31 },
      ],
    });
    const r = pensionConsequence(c);
    expect(r.creditedMonths).toBe(100); // primary only, not 129
    expect(r.recoverableMonths).toBe(29);
    expect(r.workedMonths).toBe(129);
    expect(r.crossedTenYears).toBe(false); // 100 < 120
    expect(r.crossesIfMerged).toBe(true); // 129 >= 120
    expect(r.verdict).toBe('merge_first');
    expect(r.monthlyPensionNow).toBe(0);
    expect(r.monthlyPensionIfMerged).toBeGreaterThan(0);
  });

  it('falls back to the aggregate fact when there are no service rows', () => {
    const c = view({ months: 132, service: [] });
    expect(pensionConsequence(c).creditedMonths).toBe(132);
    expect(pensionConsequence(c).verdict).toBe('already_pension');
  });

  it('says already_pension once past ten years', () => {
    const c = view({ months: 132, service: [{ uan: 'U1', eps_months: 132 }] });
    expect(pensionConsequence(c).verdict).toBe('already_pension');
    expect(pensionConsequence(c).crossedTenYears).toBe(true);
  });

  it('warns withdraw_costs_pension when work to 58 would cross the line', () => {
    // 3 years now, no split, but young enough to reach 10 by 58
    const c = view({ months: 36, dob: '1995-01-01', service: [{ uan: 'U1', eps_months: 36 }] });
    const r = pensionConsequence(c);
    expect(r.crossedTenYears).toBe(false);
    expect(r.monthlyPensionAt58).toBeGreaterThan(0);
    expect(r.verdict).toBe('withdraw_costs_pension');
  });

  it('does not count months already under the primary UAN as recoverable', () => {
    const c = view({
      months: 120,
      uan: 'U1',
      service: [
        { uan: 'U1', eps_months: 60 },
        { uan: 'U1', eps_months: 60 },
      ],
    });
    expect(pensionConsequence(c).recoverableMonths).toBe(0);
  });
});

describe('withdrawalTds', () => {
  const tdsView = (o: { continuous: number; balance: number; form15g?: boolean }): CaseView =>
    ({
      member: {} as CaseView['member'],
      facts: facts({
        continuousServiceMonths: o.continuous,
        balanceRupees: o.balance,
        form15gAttached: o.form15g ?? false,
      }),
      service: [],
    }) as unknown as CaseView;

  it('exempts anyone past five years of continuous service, whatever the balance', () => {
    const r = withdrawalTds(tdsView({ continuous: 72, balance: 900_000 }));
    expect(r.reason).toBe('exempt_five_years');
    expect(r.tdsAmount).toBe(0);
    expect(r.netIfWithdrawNow).toBe(900_000);
  });

  it('exempts a small balance below the threshold', () => {
    const r = withdrawalTds(tdsView({ continuous: 24, balance: 40_000 }));
    expect(r.reason).toBe('below_threshold');
    expect(r.tdsAmount).toBe(0);
  });

  it('exempts when Form 15G is filed', () => {
    const r = withdrawalTds(tdsView({ continuous: 24, balance: 200_000, form15g: true }));
    expect(r.reason).toBe('exempt_15g');
    expect(r.tdsAmount).toBe(0);
  });

  it('cuts 10% when under five years, over the threshold, and no 15G', () => {
    const r = withdrawalTds(tdsView({ continuous: 46, balance: 284_500 }));
    expect(r.reason).toBe('will_be_cut');
    expect(r.ratePct).toBe(TDS_RATE_PAN);
    expect(r.tdsAmount).toBe(28_450);
    expect(r.netIfWithdrawNow).toBe(256_050);
    expect(r.monthsToExempt).toBe(14); // 60 - 46
  });

  it('reports zero months to exempt once the five-year line is passed', () => {
    expect(withdrawalTds(tdsView({ continuous: 60, balance: 100_000 })).monthsToExempt).toBe(0);
  });
});

describe('passbookBreakdown', () => {
  it('accumulates the EPS diversion at the monthly cap', () => {
    const c = view({ months: 100, balance: 500_000 });
    const b = passbookBreakdown(c);
    expect(b.epfBalance).toBe(500_000);
    expect(b.monthlyEpsDiversion).toBe(EPS_MONTHLY_CAP);
    expect(b.epsPotEstimate).toBe(100 * EPS_MONTHLY_CAP);
  });
});
