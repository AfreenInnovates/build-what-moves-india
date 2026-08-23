import fs from 'node:fs';
import path from 'node:path';
import { deriveFacts, type MemberRecord, type ServiceRow } from './gates/facts';
import type { CaseFacts } from './gates/types';

export interface DemoPerson {
  slug: string;
  name: string;
  uan: string;
  scenario: 'rejected' | 'ready';
  facts: CaseFacts;
}

interface Fixture {
  member: MemberRecord & { display_name: string; scenario: 'rejected' | 'ready' };
  documents: Record<string, { name: string }>;
  service_history: ServiceRow[];
}

export function loadPerson(slug: string): DemoPerson | null {
  const file = path.join(process.cwd(), 'fixtures', 'data', `${slug}.json`);
  if (!fs.existsSync(file)) return null;

  const d = JSON.parse(fs.readFileSync(file, 'utf8')) as Fixture;

  // Placeholder for the deterministic matcher (slice 3). It counts distinct
  // names across the four records; the real one bands each pair and explains why.
  const blockingMismatches = Math.max(0, new Set(Object.values(d.documents).map((x) => x.name)).size - 1);

  return {
    slug,
    name: d.member.display_name,
    uan: d.member.uan,
    scenario: d.member.scenario,
    facts: deriveFacts(d.member, d.service_history, blockingMismatches, {
      formSelected: d.member.scenario === 'ready',
    }),
  };
}

export function listPeople(): DemoPerson[] {
  const dir = path.join(process.cwd(), 'fixtures', 'data');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => loadPerson(path.basename(f, '.json')))
    .filter((p): p is DemoPerson => p !== null)
    .sort((a, b) => (a.scenario === 'rejected' ? -1 : 1) - (b.scenario === 'rejected' ? -1 : 1));
}
