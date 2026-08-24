import Link from 'next/link';
import { listMembersWithService } from '@/lib/case';
import { SPEC } from '@/lib/gates/spec';
import { resolve } from '@/lib/gates/resolve';
import { deriveFacts } from '@/lib/gates/facts';
import { documentsFor, intakeFor, countBlockingMismatches } from '@/lib/case';
import { CasePicker, type PickerCard } from '@/components/CasePicker';
import { NewProfile } from '@/components/NewProfile';

// This page reads members from Postgres, so it must render per request.
export const dynamic = 'force-dynamic';

const SCENARIO: Record<string, PickerCard['scenario']> = {
  rejected: { label: 'Claim rejected', tone: 'error' },
  ready: { label: 'Ready to file', tone: 'success' },
  advance: { label: 'Advance, still employed', tone: 'warning' },
};

export default async function LoginPage() {
  const cards: PickerCard[] = (await listMembersWithService()).map((m) => {
    const mismatches = countBlockingMismatches(documentsFor(m.slug, m.documents));
    const r = resolve(SPEC, deriveFacts(m, m.service, mismatches, intakeFor(m.slug)));
    return {
      id: m.id,
      slug: m.slug,
      name: m.display_name,
      headline: m.headline,
      uan: m.uan,
      days: r.totalDays,
      blocking: r.blockingCount,
      balance: Math.round(m.balance_paise / 100),
      scenario: SCENARIO[m.scenario] ?? { label: m.scenario, tone: 'warning' },
    };
  });

  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 pb-28 pt-12">
      <Link
        href="/"
        className="-ml-2 inline-flex min-h-[44px] items-center rounded-sm px-2 text-[14px] font-semibold text-teal-700 hover:underline"
      >
        ← Home
      </Link>

      <h1 className="mt-4 text-[36px] leading-[1.1] font-bold tracking-tight text-ink-900">
        Whose claim shall we look at?
      </h1>
      <p className="mt-3 max-w-[60ch] text-[17px] leading-relaxed text-ink-700">
        Six people, each stuck for a different real reason. One tap — no password, no typing.
      </p>

      <CasePicker cards={cards} />

      <div className="mt-6">
        <NewProfile />
      </div>
    </main>
  );
}
