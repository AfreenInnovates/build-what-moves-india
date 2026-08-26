import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { SPEC } from './spec';
import { resolve } from './resolve';
import { deriveFacts, totalGapMonths, type MemberRecord, type ServiceRow, type Intake } from './facts';
import type { CaseFacts, GateId } from './types';

const load = (who: string) =>
  JSON.parse(fs.readFileSync(`fixtures/data/${who}.json`, 'utf8')) as {
    member: MemberRecord & Record<string, unknown>;
    service_history: ServiceRow[];
  };

const factsFor = (who: string, mismatches: number, intake: Partial<Intake> = {}): CaseFacts => {
  const d = load(who);
  return deriveFacts(d.member, d.service_history, mismatches, intake);
};

const byId = (r: ReturnType<typeof resolve>, id: GateId) => r.gates.find((g) => g.id === id)!;

// ---------------------------------------------------------------------------

describe('spec integrity', () => {
  it('every dependency names a real gate', () => {
    const ids = new Set(SPEC.gates.map((g) => g.id));
    for (const g of SPEC.gates) {
      for (const d of g.dependsOn) expect(ids, `${g.id} -> ${d}`).toContain(d);
    }
  });

  it('every gate ends with an unconditional route, so no case can fall through', () => {
    for (const g of SPEC.gates) {
      expect(g.routes.length, g.id).toBeGreaterThan(0);
      expect(g.routes.at(-1)!.when, g.id).toEqual({ op: 'true' });
    }
  });

  it('is JSON-serialisable, which is what lets a field office publish it', () => {
    expect(JSON.parse(JSON.stringify(SPEC))).toEqual(SPEC);
  });

  it('rejects a dependency cycle instead of hanging', () => {
    const cyclic = structuredClone(SPEC);
    cyclic.gates[0].dependsOn = ['attachments'];
    expect(() => resolve(cyclic, factsFor('priya', 0))).toThrow(/cycle/i);
  });
});

describe('Priya - the good state exists', () => {
  const r = resolve(SPEC, factsFor('priya', 0, { formSelected: true }));

  it('clears every applicable gate', () => {
    const bad = r.gates.filter((g) => g.status !== 'green' && g.status !== 'not_applicable');
    expect(bad.map((g) => g.id)).toEqual([]);
  });

  it('settles at the auto-settlement baseline', () => {
    expect(r.totalDays).toBe(SPEC.baselineSettlementDays);
    expect(SPEC.baselineSettlementDays).toBe(3);
    expect(r.blockingCount).toBe(0);
    expect(r.startToday).toBeNull();
  });

  it('skips Form 15G - eleven years of service, so the rule does not apply', () => {
    expect(byId(r, 'attachments').status).toBe('not_applicable');
  });
});

describe('Ravi - four gates red', () => {
  const r = resolve(SPEC, factsFor('ravi', 3));

  it('opens the countdown at 23 days', () => {
    expect(r.totalDays).toBe(23);
  });

  it('separates what you can act on now from what is waiting upstream', () => {
    expect(byId(r, 'uan_active').status).toBe('green');
    expect(byId(r, 'records_agree').status).toBe('red');
    expect(byId(r, 'e_nomination').status).toBe('red');
    expect(byId(r, 'exit_marked').status).toBe('red');
    // identity must match before EPFO will merge a second UAN
    expect(byId(r, 'service_history').status).toBe('blocked');
    expect(byId(r, 'form_selected').status).toBe('blocked');
    expect(byId(r, 'attachments').status).toBe('blocked');
  });

  it('detects the second UAN', () => {
    expect(factsFor('ravi', 3).distinctUanCount).toBe(2);
    expect(byId(r, 'service_history').route!.kind).toBe('merge_uan');
  });

  it('requires Form 15G - under 5 years, over Rs 50,000', () => {
    const f = factsFor('ravi', 3);
    expect(f.continuousServiceMonths).toBeLessThan(60);
    expect(f.balanceRupees).toBeGreaterThan(50_000);
    expect(byId(r, 'attachments').status).not.toBe('not_applicable');
  });

  it('names the slowest thing he can actually start today', () => {
    // the merge is longer but blocked; exit is the longest actionable item
    expect(r.startToday).toBe('exit_marked');
    expect(byId(r, 'exit_marked').onCriticalPath).toBe(true);
    expect(byId(r, 'e_nomination').onCriticalPath).toBe(false);
  });

  it('names the actor for every blocking gate', () => {
    for (const g of r.gates.filter((x) => x.status !== 'green' && x.status !== 'not_applicable')) {
      expect(g.actor, g.id).toMatch(/^(you|employer|epfo)$/);
    }
  });
});

describe('the countdown only moves for work that actually matters', () => {
  const base = factsFor('ravi', 3);
  const start = resolve(SPEC, base).totalDays;

  it('clearing an off-path gate does not move the number', () => {
    const after = resolve(SPEC, { ...base, eNominationFiled: true }).totalDays;
    expect(after).toBe(start); // still 27 - and the UI must say so out loud
  });

  it('clearing the critical-path gate does', () => {
    const after = resolve(SPEC, { ...base, exitMarked: true }).totalDays;
    expect(after).toBeLessThan(start);
  });

  it('descends to the baseline as the real blockers clear', () => {
    const seq: number[] = [start];
    let f = { ...base };
    f = { ...f, exitMarked: true };
    seq.push(resolve(SPEC, f).totalDays);
    f = { ...f, blockingMismatches: 0 };
    seq.push(resolve(SPEC, f).totalDays);
    f = { ...f, distinctUanCount: 1 };
    seq.push(resolve(SPEC, f).totalDays);
    // Ravi's record carries a break between his third and fourth job, so the
    // service history is a blocker in its own right and has to clear too
    f = { ...f, serviceGapMonths: 0 };
    seq.push(resolve(SPEC, f).totalDays);
    f = { ...f, eNominationFiled: true, formSelected: true, form15gAttached: true };
    seq.push(resolve(SPEC, f).totalDays);

    expect(seq).toEqual([...seq].sort((a, b) => b - a)); // monotonically decreasing
    expect(seq.at(-1)).toBe(SPEC.baselineSettlementDays);
  });
});

describe('the three correction routes, fastest first', () => {
  it('an Aadhaar-verified member files the Joint Declaration themselves via DigiLocker', () => {
    const g = byId(resolve(SPEC, factsFor('ravi', 3)), 'records_agree');
    expect(g.route!.kind).toBe('joint_declaration');
    expect(g.route!.actor).toBe('you');
    expect(g.route!.latencyDays).toBe(5);
    expect(g.route!.label).toMatch(/DigiLocker/);
  });

  it('frees the closed-employer case, which used to be the worst one', () => {
    // Lakshmi's employer has shut down. Before DigiLocker this was a 21-day
    // paper Joint Declaration; now it is the same self-service route as anyone else.
    const g = byId(resolve(SPEC, factsFor('lakshmi', 1)), 'records_agree');
    expect(g.route!.actor).toBe('you');
    expect(g.route!.latencyDays).toBe(5);
  });

  it('falls back to the employer portal when the member is not Aadhaar-verified', () => {
    const f = { ...factsFor('ravi', 3), aadhaarLinked: false };
    const g = byId(resolve(SPEC, f), 'records_agree');
    expect(g.route!.kind).toBe('employer_message');
    expect(g.route!.latencyDays).toBe(10);
  });

  it('falls back to the paper declaration when neither applies', () => {
    const f = {
      ...factsFor('ravi', 3),
      aadhaarLinked: false,
      employerResponsive: false,
      errorFromClosedEmployer: true,
    };
    const g = byId(resolve(SPEC, f), 'records_agree');
    expect(g.route!.actor).toBe('epfo');
    expect(g.route!.latencyDays).toBe(21);
  });
});

describe('every number can be traced to a source', () => {
  it('the baseline says where it came from and when it was checked', () => {
    expect(SPEC.baselineProvenance.source).toMatch(/auto-settlement/i);
    expect(SPEC.baselineProvenance.sourcedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('no route carries an unattributed latency', () => {
    for (const g of SPEC.gates) {
      for (const r of g.routes) {
        expect(r.route.provenance.source.length, `${g.id} / ${r.route.kind}`).toBeGreaterThan(20);
        expect(r.route.provenance.sourcedAt, g.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(['published', 'reported', 'estimate']).toContain(r.route.provenance.confidence);
      }
    }
  });

  it('surfaces provenance on every resolved gate that has a route', () => {
    const r = resolve(SPEC, factsFor('ravi', 3));
    for (const g of r.gates.filter((x) => x.route)) {
      expect(g.provenance, g.id).not.toBeNull();
    }
  });
});

describe('gates that do not apply are not shown', () => {
  it('skips Mark Exit for someone still employed', () => {
    const r = resolve(SPEC, factsFor('ravi', 3, { stillEmployed: true }));
    expect(byId(r, 'exit_marked').status).toBe('not_applicable');
  });
});

describe('service gaps', () => {
  const row = (from: string, to: string | null): ServiceRow => ({
    uan: 'u',
    from_date: from,
    to_date: to,
    eps_months: 0,
  });

  it('is zero for continuous employment', () => {
    expect(totalGapMonths([row('2019-01-01', '2021-01-01'), row('2021-01-01', '2023-01-01')])).toBe(0);
  });

  it('counts the months nobody claimed', () => {
    expect(totalGapMonths([row('2019-01-01', '2020-01-01'), row('2020-07-01', '2022-01-01')])).toBe(6);
  });

  it('treats overlapping employment as no gap', () => {
    expect(totalGapMonths([row('2019-01-01', '2021-06-01'), row('2021-01-01', '2022-01-01')])).toBe(0);
  });

  it('ignores an open-ended current job', () => {
    expect(totalGapMonths([row('2019-01-01', null)])).toBe(0);
  });
});

describe('normal job changes are not service gaps', () => {
  const row = (from: string, to: string | null): ServiceRow => ({
    uan: 'u',
    from_date: from,
    to_date: to,
    eps_months: 0,
  });

  it('ignores the three weeks between leaving one job and starting the next', () => {
    expect(totalGapMonths([row('2016-06-01', '2019-01-25'), row('2019-02-11', '2021-08-30')])).toBe(0);
  });

  it('still catches a genuine break in contributions', () => {
    expect(totalGapMonths([row('2016-06-01', '2019-01-25'), row('2020-02-11', '2021-08-30')])).toBe(12);
  });
});
