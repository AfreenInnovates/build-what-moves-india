import { redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { getT } from '@/lib/i18n';
import { fill, monthsInWords } from '@/lib/insights';
import { PageHead, StatTile } from '@/components/panels';
import { pension, monthsToYM } from '@/lib/insights';

export default async function PensionPage() {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');
  const t = await getT();

  const p = pension(c);
  const pct = Math.min(100, Math.round((p.serviceMonths / 120) * 100));

  return (
    <main className="px-5 pb-28 pt-7 lg:pl-9 lg:pr-6">
      <PageHead
        icon="pension"
        title={t("Pension / EPS Tracker")}
        lead={t("Your pension is decided by years of service, not a balance. Two lines matter: ten years of service, and age 58. Where you sit against them changes what you can do.")}
      />

      <div className="mt-6 max-w-[820px] space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label={t('Pensionable service')} value={p.yearsLabel} />
          <StatTile
            label={t('The 10-year line')}
            value={p.crossedTenYears ? 'Crossed' : `${p.monthsToTenYears} mo away`}
            tone={p.crossedTenYears ? 'go' : 'signal'}
          />
          {p.ageNow !== null && (
            <StatTile
              label={t('Years to pension (58)')}
              value={p.yearsToPension === 0 ? 'Eligible' : `${p.yearsToPension} yr`}
              sub={`You are ${p.ageNow} now`}
            />
          )}
        </div>

        {/* the 10-year progress bar */}
        <section className="rounded-md border border-ink-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-ink-900">{t('Progress to 10 years')}</h2>
            <span className="tabular text-[13px] font-semibold text-ink-500">
              {monthsToYM(p.serviceMonths)} of 10 yr
            </span>
          </div>
          <div className="mt-3 h-4 overflow-hidden rounded-full bg-ink-100">
            <div
              className={`h-full rounded-full ${p.crossedTenYears ? 'bg-go' : 'bg-signal'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-800">
            {p.crossedTenYears ? (
              <>
                {t(
                  'You have passed ten years. Your EPS is now a monthly pension from age 58 - it can no longer be taken as a lump sum. If that is not what you want, this was the line to know about before crossing it.',
                )}
              </>
            ) : (
              <>
                {fill(
                  t(
                    'You are {span} short of ten years. Below this line your EPS can be withdrawn as a lump sum (Form 10C). At ten years it converts to a pension you cannot touch until 58. Decide which you want before you cross it.',
                  ),
                  { span: monthsInWords(p.monthsToTenYears, t) },
                )}
              </>
            )}
          </p>
        </section>

        <section className="rounded-md border-l-4 border-teal-700 bg-teal-50 px-4 py-4">
          <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-teal-700">
            {t('Why nobody tells you this')}
          </p>
          <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-800">
            {t('The ten-year line is invisible on the EPFO portal. People cross it without knowing, then find at withdrawal that their pension pot is locked until 58. Knowing where you stand is the whole point of this page.')}
          </p>
        </section>
      </div>
    </main>
  );
}
