/**
 * Benchmark the pure core: the gate resolver, the schedule, and the pension math.
 *
 * These three functions are the part of Seven Gates that actually does the
 * thinking, and they were written pure - no I/O, no dates, no randomness - so
 * they can be measured honestly in isolation, without a network or a database in
 * the way. The number this prints is a real claim about the engine, not the
 * framework around it.
 *
 * Run: npm run bench
 */
import { SPEC } from '../lib/gates/spec';
import { resolve } from '../lib/gates/resolve';
import { schedule, savings } from '../lib/schedule';
import { pensionConsequence } from '../lib/pension';
import type { CaseFacts } from '../lib/gates/types';
import type { CaseView } from '../lib/case';

/** A deliberately busy case: multiple UANs, mismatches, an unmarked exit. */
const facts: CaseFacts = {
  uanActive: false,
  aadhaarLinked: false,
  eNominationFiled: false,
  exitMarked: false,
  stillEmployed: false,
  blockingMismatches: 3,
  distinctUanCount: 2,
  serviceGapMonths: 6,
  continuousServiceMonths: 46,
  totalEpsServiceMonths: 129,
  balanceRupees: 284_500,
  formSelected: false,
  form15gAttached: false,
  employerResponsive: true,
  errorFromClosedEmployer: false,
};

const view = {
  member: { uan: '100200300400', epfo_dob: '1990-04-14' },
  facts,
  service: [
    { uan: '100200300400', eps_months: 46, from_date: '2021-09-06', to_date: null },
    { uan: '100977600233', eps_months: 29, from_date: '2019-03-01', to_date: '2021-08-20' },
    { uan: '100200300400', eps_months: 23, from_date: '2017-02-11', to_date: '2019-01-25' },
    { uan: '100200300400', eps_months: 31, from_date: '2014-06-01', to_date: '2017-01-20' },
  ],
} as unknown as CaseView;

type Case = { name: string; run: () => void };

const cases: Case[] = [
  { name: 'resolve (7 gates, topo + critical path)', run: () => void resolve(SPEC, facts) },
  {
    name: 'resolve + schedule + savings (full dashboard compute)',
    run: () => {
      const r = resolve(SPEC, facts);
      schedule(r);
      savings(r);
    },
  },
  { name: 'pensionConsequence', run: () => void pensionConsequence(view) },
];

/** Time one case: warm up, then measure, and report ops/sec and per-op latency. */
function bench({ name, run }: Case) {
  // warm up so we measure steady-state, not the JIT compiling the first calls
  for (let i = 0; i < 5_000; i++) run();

  const iterations = 200_000;
  const samples: number[] = [];
  const t0 = performance.now();
  for (let i = 0; i < iterations; i++) {
    // sample per-op latency on a 1% slice - timing every call would measure the
    // clock more than the code
    if (i % 100 === 0) {
      const s = performance.now();
      run();
      samples.push(performance.now() - s);
    } else {
      run();
    }
  }
  const totalMs = performance.now() - t0;

  samples.sort((a, b) => a - b);
  const pct = (p: number) => samples[Math.min(samples.length - 1, Math.floor(samples.length * p))];
  const opsPerSec = Math.round(iterations / (totalMs / 1000));

  console.log(`\n${name}`);
  console.log(`  ${opsPerSec.toLocaleString('en-IN')} ops/sec  (${iterations.toLocaleString('en-IN')} runs in ${totalMs.toFixed(0)}ms)`);
  console.log(`  per call:  p50 ${(pct(0.5) * 1000).toFixed(1)}µs   p99 ${(pct(0.99) * 1000).toFixed(1)}µs`);
}

console.log('Seven Gates - core engine benchmark');
console.log('Node', process.version, '·', new Date().toISOString().slice(0, 10));
console.log('The resolver is pure, so this measures the engine alone - no DB, no network.');
for (const c of cases) bench(c);
console.log('\nThese are the compute limits of one instance. In production the database and');
console.log('third-party routes bind first, which is what the load test measures.');
