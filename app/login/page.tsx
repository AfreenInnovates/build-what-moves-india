import Link from 'next/link';
import { listMembersWithService } from '@/lib/case';
import { SPEC } from '@/lib/gates/spec';
import { resolve } from '@/lib/gates/resolve';
import { deriveFacts } from '@/lib/gates/facts';
import { documentsFor, intakeFor, countBlockingMismatches } from '@/lib/case';
import { CasePicker, type PickerCard } from '@/components/CasePicker';
import { NewProfile } from '@/components/NewProfile';
import { ResetExamples } from '@/components/ResetExamples';
import { listEmployers } from '@/lib/employer';
import { SignInAs } from '@/components/SignInAs';
import { Icon } from '@/components/Icon';
import { getT } from '@/lib/i18n';

// This page reads members from Postgres, so it must render per request.
export const dynamic = 'force-dynamic';

const SCENARIO: Record<string, PickerCard['scenario']> = {
  rejected: { label: 'Claim rejected', tone: 'error' },
  ready: { label: 'Ready to file', tone: 'success' },
  advance: { label: 'Advance, still employed', tone: 'warning' },
  stuck: { label: 'Filed, then silence', tone: 'warning' },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; as?: string }>;
}) {
  const t = await getT();
  const employers = await listEmployers();
  const params = await searchParams;
  const justReset = params.reset === '1';
  const startOn = params.as === 'employer' ? 'employer' : 'employee';
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
      // ...with one exception: a stuck claim has no blockers left by design, so
      // the blocking count says "ready" while the member is in fact waiting on a
      // grievance. The scenario wins there.
      scenario:
        r.blockingCount === 0 && m.scenario !== 'stuck'
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
        {t('← Home')}
      </Link>

      <h1 className="mt-4 text-[36px] leading-[1.1] font-bold tracking-tight text-ink-900">
        {t('Which side would you like to see?')}
      </h1>
      <p className="mt-3 max-w-[60ch] text-[17px] leading-relaxed text-ink-700">
        {t('A stalled claim has two sides. Six people who cannot get their EPF money out, each stuck for a different real reason - and the companies they used to work for, who are the only ones able to fix some of it.')}
      </p>

      <SignInAs
        initial={startOn}
        labels={Object.fromEntries(
          [
            'Sign in as',
            'Employee',
            'Someone trying to get their own PF money out. Six people, each stuck differently.',
            'Employer',
            'A company they used to work for. Requests waiting on you to act.',
          ].map((k) => [k, t(k)]),
        )}
        employer={
          employers.length === 0 ? (
            <div className="rounded-xl border border-ink-100 bg-white px-5 py-8 text-center">
              <p className="text-[15.5px] leading-relaxed text-ink-700">
                {t('No company has been sent a request yet. Open a case, go to Employer Requests and send one - the company will appear here.')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {employers.map((e) => (
                <a
                  key={e.token}
                  href={`/employer/${e.token}`}
                  className="card-hover group flex h-full flex-col rounded-xl border border-ink-100 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[16.5px] font-bold text-ink-900">{e.name}</p>
                    {e.waiting > 0 && (
                      <span className="tabular shrink-0 rounded-full bg-stop px-2.5 py-1 text-[12px] font-bold text-white">
                        {e.waiting}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-600">
                    {e.waiting > 0
                      ? `${e.waiting} ${e.waiting === 1 ? t('request is waiting on them') : t('requests are waiting on them')}`
                      : t('Everything sent to them has been dealt with')}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 border-t border-ink-100 pt-3.5 text-[13.5px] font-bold text-teal-700">
                    {t('Open their queue')}
                    <Icon name="arrow" size={14} aria-hidden />
                  </span>
                </a>
              ))}
            </div>
          )
        }
        employee={
          <>
      <CasePicker
        cards={cards}
        fresh={<NewProfile />}
        labels={Object.fromEntries(
          [
            'Claim rejected',
            'Ready to file',
            'Advance, still employed',
            'Sign in',
            'Opening…',
            'UAN',
            'days',
            ...cards.map((c) => c.headline ?? ''),
          ].map((k) => [k, t(k)]),
        )}
      />

          </>
        }
      />


      <ResetExamples justReset={justReset} />
    </main>
  );
}
