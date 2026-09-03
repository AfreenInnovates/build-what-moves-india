import { describe, it, expect } from 'vitest';
import { SPEC } from './gates/spec';
import { resolve } from './gates/resolve';
import { schedule, savings } from './schedule';
import type { CaseFacts } from './gates/types';

/**
 * The schedule is what the timeline draws and what "you save N days" claims, so
 * it is tested against the real spec rather than a toy graph. If a latency in
 * lib/gates/spec.ts changes, these numbers should change with it - that is the
 * point of asserting them.
 */

const base: CaseFacts = {
  uanActive: true,
  aadhaarLinked: true,
  eNominationFiled: true,
  exitMarked: true,
  stillEmployed: false,
  blockingMismatches: 0,
  distinctUanCount: 1,
  serviceGapMonths: 0,
  continuousServiceMonths: 132,
  totalEpsServiceMonths: 132,
  balanceRupees: 400_000,
  formSelected: true,
  form15gAttached: true,
  employerResponsive: true,
  errorFromClosedEmployer: false,
};

describe('schedule', () => {
  it('is null when nothing is left to do', () => {
    expect(schedule(resolve(SPEC, base))).toBeNull();
  });

  it('gives a gate with slack a saving of zero', () => {
    // e-Nomination costs a day and hangs off an already-cleared root, so it
    // finishes long before a ten-day employer correction running beside it.
    const facts = { ...base, eNominationFiled: false, blockingMismatches: 2, aadhaarLinked: false };
    const r = resolve(SPEC, facts);
    const saved = savings(r);

    expect(saved.get('e_nomination')).toBe(0);
    expect(r.gates.find((g) => g.id === 'e_nomination')!.onCriticalPath).toBe(false);
  });

  it('saves only the gap to the next constraint, not the whole latency', () => {
    // Two employer tasks run in parallel underneath service history: the records
    // correction and the exit date. Clearing the longer one hands the constraint
    // to the shorter one rather than removing the wait entirely.
    const facts = { ...base, blockingMismatches: 2, aadhaarLinked: false, exitMarked: false };
    const r = resolve(SPEC, facts);
    const before = r.totalDays;

    const cleared = resolve(SPEC, { ...facts, blockingMismatches: 0 });
    const actualDrop = before - cleared.totalDays;

    expect(savings(r).get('records_agree')).toBe(actualDrop);
    // and the point of the whole exercise: the drop is smaller than the latency
    const gate = r.gates.find((g) => g.id === 'records_agree')!;
    expect(actualDrop).toBeLessThan(gate.latencyDays);
    expect(actualDrop).toBeGreaterThan(0);
  });

  it('agrees with the resolver on the total, and splits it into span plus baseline', () => {
    const r = resolve(SPEC, { ...base, blockingMismatches: 2, aadhaarLinked: false });
    const plan = schedule(r)!;

    expect(plan.totalDays).toBe(r.totalDays);
    expect(plan.span + plan.baselineDays).toBe(r.totalDays);
    expect(plan.baselineDays).toBe(SPEC.baselineSettlementDays);
  });

  it('puts the critical chain on lane 0 and never overlaps bars in one lane', () => {
    const r = resolve(SPEC, {
      ...base,
      blockingMismatches: 2,
      aadhaarLinked: false,
      exitMarked: false,
      eNominationFiled: false,
      distinctUanCount: 2,
    });
    const plan = schedule(r)!;

    for (const b of plan.bars) {
      if (b.gate.onCriticalPath) expect(b.lane).toBe(0);
      expect(b.end).toBe(b.start + b.gate.latencyDays);
      expect(b.end).toBeLessThanOrEqual(plan.span);
    }

    const byLane = new Map<number, typeof plan.bars>();
    for (const b of plan.bars) byLane.set(b.lane, [...(byLane.get(b.lane) ?? []), b]);
    for (const lane of byLane.values()) {
      const sorted = [...lane].sort((a, b) => a.start - b.start);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].start).toBeGreaterThanOrEqual(sorted[i - 1].end);
      }
    }
  });

  it('gives critical-path gates zero slack and off-path gates real room', () => {
    const r = resolve(SPEC, {
      ...base,
      blockingMismatches: 2,
      aadhaarLinked: false,
      eNominationFiled: false,
    });
    const plan = schedule(r)!;

    for (const b of plan.bars) {
      // slack and the critical path are two views of the same fact
      expect(b.slack === 0).toBe(b.gate.onCriticalPath);
      // a gate can never be delayed past the end of the whole schedule
      expect(b.end + b.slack).toBeLessThanOrEqual(plan.span);
    }

    const nomination = plan.bars.find((b) => b.gate.id === 'e_nomination')!;
    expect(nomination.slack).toBeGreaterThan(0);
    // delaying it by exactly its slack still lands inside the existing wait
    expect(nomination.end + nomination.slack).toBeLessThanOrEqual(plan.span);
  });

  it('never claims a saving larger than the total wait', () => {
    const r = resolve(SPEC, {
      ...base,
      uanActive: false,
      aadhaarLinked: false,
      blockingMismatches: 3,
      exitMarked: false,
      eNominationFiled: false,
      distinctUanCount: 2,
      formSelected: false,
      form15gAttached: false,
      continuousServiceMonths: 20,
    });
    const plan = schedule(r)!;
    for (const [, days] of savings(r)) {
      expect(days).toBeGreaterThanOrEqual(0);
      expect(days).toBeLessThanOrEqual(plan.span);
    }
  });
});
