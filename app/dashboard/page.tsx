import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { Countdown } from '@/components/Countdown';
import { ButtonLink } from '@/components/ui';
import { AlertCard } from '@/components/panels';
import { Icon } from '@/components/Icon';
import { SECTIONS } from '@/lib/sections';
import { getT } from '@/lib/i18n';
import { transferStory, alerts, preFlight, fill } from '@/lib/insights';

export default async function DashboardPage() {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');

  const { resolution: r, member } = c;
  const t = await getT();
  const story = transferStory(c, t);
  const attention = alerts(c, t).filter((a) => a.severity !== 'good');
  /** How many alerts the overview shows before handing off to the Alerts page. */
  const SHOWN = 4;
  const pre = preFlight(c);
  const startGate = r.gates.find((g) => g.id === r.startToday);

  return (
    <main className="px-5 pb-28 pt-7 lg:pl-9 lg:pr-4">
      <div className="border-b border-ink-100 pb-5">
        <p className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.08em] text-teal-600">
          <Icon name="preflight" size={15} aria-hidden /> {t('Pre-Flight')}
        </p>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight text-ink-900">
          {member.display_name}
        </h1>
        <p className="tabular mt-0.5 text-[14px] text-ink-500">
          UAN {member.uan} · {member.employer_name}
        </p>
      </div>

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(320px,380px)_1fr] lg:items-start">
        {/* left rail */}
        <div className="space-y-4 lg:sticky lg:top-20">
          <section className="rounded-md border border-ink-100 bg-white shadow-[0_1px_2px_rgba(16,20,24,0.04)]">
            <Countdown
              days={r.totalDays}
              from={c.previousDays}
              blocking={r.blockingCount}
              total={r.gates.length}
              labels={Object.fromEntries(
                [
                  'Your money arrives in',
                  'Your money is blocked for',
                  'working days',
                  'Nothing is blocking you. This is what a clean claim looks like.',
                  'of',
                  'steps are blocking. Not all of them cost you time.',
                ].map((k) => [k, t(k)]),
              )}
            />
            {startGate && (
              <div className="mx-5 mb-5 rounded-sm border-l-4 border-teal-700 bg-teal-50 px-4 py-3.5">
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-teal-700">
                  {t('Start today')}
                </p>
                <p className="mt-1.5 text-[15.5px] leading-snug text-teal-900">
                  {startGate.route!.label}
                </p>
                <ButtonLink href={`/dashboard/fix/${startGate.id}`} className="mt-3 px-5 py-2.5 text-[14px]">
                  {t('Open this')}
                </ButtonLink>
              </div>
            )}
          </section>

        </div>

        {/* right column */}
        <div className="space-y-7">
          {/* the transfer story - where did this break */}
          <section className="rounded-md border-2 border-ink-100 bg-white p-5" data-tour="overview">
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-teal-600">
              {t('Your claim, in one sentence')}
            </p>
            <p className="mt-2.5 text-[19px] leading-relaxed text-ink-900">
              {story.employerCount === 1 ? (
                <>
                  You are claiming the EPF you built up at{' '}
                  <span className="font-bold text-teal-700">{story.fromEmployer}</span>.
                </>
              ) : (
                <>
                  You are claiming the EPF from all{' '}
                  <span className="font-bold">{story.employerCount}</span> jobs on your record,
                  starting at <span className="font-bold text-teal-700">{story.fromEmployer}</span>{' '}
                  and ending at{' '}
                  <span className="font-bold text-teal-700">{story.toEmployer}</span>.
                </>
              )}
            </p>

            {story.mistakes.length > 0 ? (
              <>
                <p className="mt-5 text-[13px] font-bold uppercase tracking-[0.08em] text-stop">
                  {t('What is standing in the way')}
                </p>
                <ul className="mt-2 space-y-2">
                  {story.mistakes.map((mi, i) => (
                    <li key={i} className="flex gap-3 rounded-sm bg-stop-soft/50 px-3.5 py-2.5">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-stop" aria-hidden />
                      <p className="text-[15.5px] leading-relaxed text-ink-800">
                        <span className="font-semibold">{t(mi.where)}:</span> {fill(t(mi.what), mi.vars)}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="mt-3.5 text-[14.5px] leading-relaxed text-ink-500">
                  {t(
                    'None of this was your fault, and none of it was visible until you tried to claim. The Action Center lists every fix and who has to make it.',
                  )}
                </p>
              </>
            ) : (
              <p className="mt-4 rounded-md border-l-4 border-go bg-go-soft px-4 py-3.5 text-[16px] leading-relaxed text-ink-800">
                Nothing is standing in the way. Your records agree, your service has no gaps, and
                you can file today.
              </p>
            )}
          </section>

          {/* pre-flight checklist */}
          <section className="rounded-md border border-ink-100 bg-white p-5" data-tour="gates">
            <div className="flex items-center justify-between">
              <h2 className="text-[19px] font-bold text-ink-900">{t('Ready to file?')}</h2>
              <span
                className={`rounded-full px-3 py-1 text-[12.5px] font-bold ${
                  pre.ready ? 'bg-go text-white' : 'bg-stop-soft text-stop'
                }`}
              >
                {pre.ready ? t('Cleared for filing') : `${pre.blockingCount} ${t('still blocking')}`}
              </span>
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {pre.items.map((it) => (
                <li key={it.label} className="flex items-center gap-2.5 text-[14px]">
                  <span aria-hidden>
                    {it.ok ? (
                      <svg width="17" height="17" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="9" fill="var(--color-go)" />
                        <path d="M6 10.5l2.6 2.5L14 7.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="9" fill="none" stroke="var(--color-ink-300)" strokeWidth="1.6" strokeDasharray="3 2.5" />
                      </svg>
                    )}
                  </span>
                  <span className={it.ok ? 'text-ink-500' : 'font-medium text-ink-900'}>
                    {t(it.label)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* alerts summary */}
          {attention.length > 0 && (
            <section data-tour="attention">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-[19px] font-bold text-ink-900"><Icon name="alerts" size={18} className="text-signal" aria-hidden /> {t('Needs your attention')}</h2>
                <Link href="/dashboard/alerts" className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[14px] font-semibold text-teal-700 hover:underline">
                  {attention.length > SHOWN ? `${t('See all')} ${attention.length}` : t('See all')}
                  <Icon name="arrow" size={15} aria-hidden />
                </Link>
              </div>
              <div className="space-y-2.5">
                {attention.slice(0, SHOWN).map((a, i) => (
                  <AlertCard key={`${a.gateId ?? 'x'}:${i}`} alert={a} t={t} />
                ))}
              </div>
              {/*
                Silently cutting the list at three meant a member could be told
                "2 still blocking" and shown one card. If anything is held back,
                say how many and where they are.
              */}
              {attention.length > SHOWN && (
                <Link
                  href="/dashboard/alerts"
                  className="mt-2.5 block rounded-lg border border-dashed border-ink-200 px-5 py-3 text-center text-[14.5px] font-semibold text-teal-700 hover:border-teal-700 hover:bg-teal-50"
                >
                  {attention.length - SHOWN} more{' '}
                  {attention.length - SHOWN === 1 ? 'item needs' : 'items need'} your attention
                </Link>
              )}
            </section>
          )}

          {/* section tiles */}
          <section>
            <h2 className="text-[19px] font-bold text-ink-900">{t('Explore your EPF')}</h2>
            <p className="mb-3 mt-1 text-[15px] leading-relaxed text-ink-600">
              {t('Each section answers one question about your claim.')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {SECTIONS.filter((s) => s.href !== '/dashboard').map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="rounded-md border border-ink-100 bg-white px-4 py-3.5 transition hover:border-teal-700 hover:shadow-[0_2px_10px_rgba(5,81,96,0.07)]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                      <Icon name={s.icon} size={18} aria-hidden />
                    </span>
                    <p className="text-[15px] font-bold text-ink-900">{t(s.label)}</p>
                  </div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-500">{t(s.blurb)}</p>
                </Link>
              ))}
            </div>
          </section>
</div>
      </div>
    </main>
  );
}
