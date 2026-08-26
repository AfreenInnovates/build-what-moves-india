import Link from 'next/link';
import { listMembersWithService } from '@/lib/case';
import { SPEC } from '@/lib/gates/spec';
import { resolve } from '@/lib/gates/resolve';
import { deriveFacts } from '@/lib/gates/facts';
import { documentsFor, intakeFor, countBlockingMismatches } from '@/lib/case';
import { CasePicker, type PickerCard } from '@/components/CasePicker';
import { NewProfile } from '@/components/NewProfile';
import { ResetExamples } from '@/components/ResetExamples';

// This page reads members from Postgres, so it must render per request.
export const dynamic = 'force-dynamic';

const SCENARIO: Record<string, PickerCard['scenario']> = {
  rejected: { label: 'Claim rejected', tone: 'error' },
  ready: { label: 'Ready to file', tone: 'success' },
  advance: { label: 'Advance, still employed', tone: 'warning' },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const justReset = (await searchParams).reset === '1';
  const cards: PickerCard[] = (await listMembersWithService()).map((m) => {
    // prefer the live case; fall back to a fresh derivation for anyone not opened yet
    const facts =
      m.caseFacts ??
      deriveFacts(m, m.service, countBlockingMismatches(documentsFor(m.slug, m.documents)), intakeFor(m.slug));
    const r = resolve(SPEC, facts);
    return {
      id: m.id,
      slug: m.slug,
      name: m.display_name,
      headline: m.headline,
      uan: m.uan,
      days: r.totalDays,
      blocking: r.blockingCount,
      balance: Math.round(m.balance_paise / 100),
      // The scenario column records how this person STARTED. Once their gates are
      // cleared the card was still saying "Claim rejected" next to a day count of
      // 3, which is the fully-cleared baseline - the tag contradicting the number
      // printed beside it. What the card shows now is where they actually stand.
      scenario:
        r.blockingCount === 0
          ? { label: 'Ready to file', tone: 'success' as const }
          : (SCENARIO[m.scenario] ?? { label: m.scenario, tone: 'warning' as const }),
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
        Six people who have opened a claim to take their EPF money out, and each one is stuck for a
        different real reason: a name that does not match, an exit date nobody recorded, a second
        UAN, a nomination never filed. Sign in as any of them with the password shown on their
        card, or set up your own case.
      </p>

      <CasePicker cards={cards} fresh={<NewProfile />} />

      <ResetExamples justReset={justReset} />
    </main>
  );
}
