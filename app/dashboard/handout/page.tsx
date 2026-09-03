import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { getT } from '@/lib/i18n';
import { PrintButton } from '@/components/PrintButton';
import { Icon } from '@/components/Icon';
import { savings } from '@/lib/schedule';
import { fill } from '@/lib/insights';
import type { GateStatus, Actor } from '@/lib/gates/types';

/**
 * The page a member can hand to somebody.
 *
 * The real next physical step is often a conversation - with an old employer's
 * HR desk, or across a counter at a facilitation centre - and until now the
 * product had nothing to take to it. This is one sheet of paper: what is wrong,
 * who has to fix it, and how long it takes, with the disclaimer that this is not
 * EPFO carried at the bottom where it cannot be cropped off.
 *
 * No PDF dependency. The browser's print dialog saves to PDF everywhere.
 */

const STATUS_LABEL: Record<GateStatus, string> = {
  green: 'Cleared',
  red: 'Needs action now',
  blocked: 'Waiting on an earlier step',
  not_applicable: 'Does not apply',
};

const ACTOR_LABEL: Record<Actor, string> = {
  you: 'The member',
  employer: 'The employer',
  epfo: 'EPFO',
};

export default async function HandoutPage() {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');
  const t = await getT();

  const { resolution: r, member } = c;
  const saved = savings(r);
  const shown = r.gates.filter((g) => g.status !== 'not_applicable');
  const employerItems = shown.filter((g) => g.actor === 'employer' && g.status !== 'green');
  const generated = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="mx-auto max-w-[820px] px-5 pb-28 pt-7 print:max-w-none print:px-0 print:pt-0">
      {/* screen-only controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-teal-700 hover:underline"
        >
          <Icon name="back" size={16} aria-hidden /> {t('Back to your case')}
        </Link>
        <PrintButton label={t('Print / Save as PDF')} />
      </div>

      <p className="mb-5 max-w-[62ch] text-[15px] leading-relaxed text-ink-600 print:hidden">
        {t(
          'One page you can print or save, and hand to your old employer or take to an EPFO office. It lists every check, who has to act on it, and how long it takes.',
        )}
      </p>

      <article className="handout rounded-md border border-ink-100 bg-white p-7 print:rounded-none print:border-0 print:p-0">
        {/* masthead */}
        <header className="flex items-start justify-between gap-4 border-b-2 border-ink-900 pb-3">
          <div>
            <p className="text-[19px] font-bold tracking-tight text-ink-900">{t('Seven Gates')}</p>
            <p className="text-[13px] text-ink-500">{t('EPF claim readiness summary')}</p>
          </div>
          <p className="shrink-0 rounded-sm bg-stop-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-stop">
            {t('Not EPFO')}
          </p>
        </header>

        {/* who this is about */}
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[14px] sm:grid-cols-4">
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.07em] text-ink-400">
              {t('Member')}
            </dt>
            <dd className="font-semibold text-ink-900">{member.display_name}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.07em] text-ink-400">
              {t('UAN')}
            </dt>
            <dd className="tabular font-semibold text-ink-900">{member.uan}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.07em] text-ink-400">
              {t('Employer on record')}
            </dt>
            <dd className="font-semibold text-ink-900">{member.employer_name}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.07em] text-ink-400">
              {t('Prepared on')}
            </dt>
            <dd className="tabular font-semibold text-ink-900">{generated}</dd>
          </div>
        </dl>

        {/* the headline number */}
        <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-sm bg-ink-50 px-4 py-3">
          <span className="tabular text-[34px] font-bold leading-none text-signal">
            {r.totalDays}
          </span>
          <span className="text-[15px] font-semibold text-ink-800">{t('working days')}</span>
          <span className="text-[14px] text-ink-600">
            {r.blockingCount === 0
              ? t('Nothing is blocking this claim.')
              : fill(t('{n} of {total} checks are still blocking.'), {
                  n: String(r.blockingCount),
                  total: String(shown.length),
                })}
          </span>
        </div>

        {/* the checks */}
        <h2 className="mt-6 text-[13px] font-bold uppercase tracking-[0.08em] text-ink-500">
          {t('The seven checks')}
        </h2>
        <table className="mt-2 w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="border-b border-ink-200 text-left">
              <th className="py-1.5 pr-3 font-bold text-ink-700">{t('Check')}</th>
              <th className="py-1.5 pr-3 font-bold text-ink-700">{t('Status')}</th>
              <th className="py-1.5 pr-3 font-bold text-ink-700">{t('Who must act')}</th>
              <th className="py-1.5 text-right font-bold text-ink-700">{t('Days')}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((g) => (
              <tr key={g.id} className="border-b border-ink-100 align-top">
                <td className="py-2 pr-3">
                  <span className="font-semibold text-ink-900">{t(g.title)}</span>
                  {g.route && g.status !== 'green' && (
                    <span className="block text-[12.5px] leading-snug text-ink-500">
                      {t(g.route.label)}
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3">
                  <span
                    className={
                      g.status === 'green'
                        ? 'font-semibold text-go'
                        : g.status === 'red'
                          ? 'font-semibold text-stop'
                          : 'font-semibold text-wait'
                    }
                  >
                    {t(STATUS_LABEL[g.status])}
                  </span>
                </td>
                <td className="py-2 pr-3 text-ink-700">
                  {g.actor ? t(ACTOR_LABEL[g.actor]) : '—'}
                </td>
                <td className="tabular py-2 text-right text-ink-700">
                  {g.status === 'green' ? '—' : g.latencyDays}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* what the person reading this has to do */}
        {employerItems.length > 0 && (
          <section className="mt-6 rounded-sm border-l-4 border-signal bg-signal-soft px-4 py-3">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-signal">
              {t('If you are the employer, these are yours')}
            </h2>
            <ul className="mt-2 space-y-1.5">
              {employerItems.map((g) => (
                <li key={g.id} className="text-[14px] leading-snug text-ink-800">
                  <span className="font-semibold">{t(g.title)}</span> — {t(g.route!.label)}
                  {(saved.get(g.id) ?? 0) > 0 && (
                    <span className="tabular font-semibold text-signal">
                      {' '}
                      {fill(t('({n} days off the wait)'), { n: String(saved.get(g.id)) })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-7 border-t border-ink-200 pt-3 text-[11.5px] leading-relaxed text-ink-500">
          <p className="font-semibold text-ink-700">
            {t('This is not an EPFO document and carries no official standing.')}
          </p>
          <p className="mt-1">
            {t(
              'Seven Gates is an independent prototype. It is not connected to EPFO, not endorsed by EPFO, and files nothing on your behalf. Day counts are estimates drawn from published EPFO figures and member-reported timelines, and are shown with their source inside the app. Demo accounts use synthetic records only.',
            )}
          </p>
        </footer>
      </article>
    </main>
  );
}
