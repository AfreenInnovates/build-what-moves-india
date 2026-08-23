/**
 * Prints the seven-gate spine for each seeded member.
 * The UI is a rendering of this; nothing here knows what a pixel is.
 *
 *   npm run spine
 *   npm run spine -- ravi --closed-employer
 */
import fs from 'node:fs';
import { SPEC } from '../lib/gates/spec';
import { resolve } from '../lib/gates/resolve';
import { deriveFacts, type MemberRecord, type ServiceRow } from '../lib/gates/facts';
import type { GateStatus, ResolvedGate } from '../lib/gates/types';

const MARK: Record<GateStatus, string> = {
  green: '\x1b[32m●\x1b[0m',
  red: '\x1b[31m◐\x1b[0m',
  blocked: '\x1b[33m◯\x1b[0m',
  not_applicable: '\x1b[90m·\x1b[0m',
};

const dim = (s: string) => `\x1b[90m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const who = args.filter((a) => !a.startsWith('--'));
const people = who.length ? who : ['ravi', 'priya'];

for (const person of people) {
  const d = JSON.parse(fs.readFileSync(`fixtures/data/${person}.json`, 'utf8')) as {
    member: MemberRecord & { display_name: string; scenario: string };
    documents: Record<string, Record<string, string>>;
    intake?: Record<string, boolean>;
    service_history: ServiceRow[];
  };

  // stand-in for the deterministic matcher, which lands in slice 3
  const docs = Object.values(d.documents) as Record<string, string>[];
  const blockingMismatches = (['name', 'dob', 'father_name'] as const).filter(
    (f) => new Set(docs.map((x) => x[f]).filter(Boolean)).size > 1,
  ).length;

  const facts = deriveFacts(d.member, d.service_history, blockingMismatches, {
    ...(d.intake ?? {}),
    ...(flags.has('--closed-employer') ? { errorFromClosedEmployer: true } : {}),
  });

  const r = resolve(SPEC, facts);

  console.log(`\n${bold(d.member.display_name)}  ${dim(`UAN ${d.member.uan} · spec ${r.specVersion}`)}`);
  console.log(
    `${bold(`\x1b[38;5;208m${r.totalDays} working days\x1b[0m`)}` +
      dim(`   ${r.blockingCount} of ${r.gates.length} gates blocking`),
  );
  console.log(dim('─'.repeat(72)));

  for (const g of r.gates) {
    const path = g.onCriticalPath ? '\x1b[38;5;208m ← on the critical path\x1b[0m' : '';
    console.log(`${MARK[g.status]} ${g.title.padEnd(26)}${dim(label(g))}${path}`);
    if (g.status === 'red' || g.status === 'blocked') {
      console.log(`  ${dim('│')}  ${g.blocks}`);
      console.log(`  ${dim('│')}  ${dim(`${g.route!.label} · ${g.actor} · ${g.latencyDays}d`)}`);
    }
  }

  console.log(dim('─'.repeat(72)));
  console.log(
    r.startToday
      ? `Start today: ${bold(r.startToday)} ${dim('— longest latency you can actually act on')}`
      : dim('Nothing is blocking. File the claim.'),
  );
}

function label(g: ResolvedGate): string {
  if (g.status === 'green') return 'cleared';
  if (g.status === 'not_applicable') return 'does not apply to you';
  if (g.status === 'blocked') return `waiting on ${g.dependsOn.join(', ')}`;
  return 'act on this now';
}
