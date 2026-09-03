import { redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { getT } from '@/lib/i18n';
import { fill, monthsInWords, inr } from '@/lib/insights';
import { PageHead, StatTile } from '@/components/panels';
import { pension, monthsToYM } from '@/lib/insights';
import { pensionConsequence } from '@/lib/pension';

export default async function PensionPage() {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');
  const t = await getT();

  const p = pension(c);
  const pc = pensionConsequence(c);
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

        {/*
          What withdrawing costs, in a number.

          The progress bar above says where they sit. This says what it is worth -
          a monthly pension for life against a one-time payment - because that is
          the decision the portal never frames and no checklist can compute.
        */}
        <section className="rounded-md border-2 border-signal/30 bg-white p-5" data-tour="pension-sim">
          <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-signal">
            {t('Should you withdraw at all?')}
          </p>

          {pc.verdict === 'merge_first' ? (
            <>
              <p className="mt-2 text-[16px] leading-relaxed text-ink-900">
                {fill(
                  t(
                    'You have worked {worked}, but only {credited} is credited - the rest is stranded under a second account. That gap is what keeps you under ten years.',
                  ),
                  { worked: monthsToYM(pc.workedMonths), credited: monthsToYM(pc.creditedMonths) },
                )}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-sm bg-stop-soft px-4 py-3.5">
                  <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-stop">
                    {t('Withdraw today')}
                  </p>
                  <p className="mt-1 text-[15px] leading-snug text-ink-800">
                    {t('A one-time payment, and no pension - ever. The clock resets to zero.')}
                  </p>
                </div>
                <div className="rounded-sm bg-go-soft px-4 py-3.5">
                  <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-go">
                    {t('Merge the account first')}
                  </p>
                  <p className="mt-1 text-[15px] leading-snug text-ink-800">
                    {fill(t('You cross ten years - about {amount} a month, for the rest of your life.'), {
                      amount: inr(pc.monthlyPensionIfMerged),
                    })}
                  </p>
                </div>
              </div>
            </>
          ) : pc.verdict === 'already_pension' ? (
            <p className="mt-2 text-[16px] leading-relaxed text-ink-900">
              {fill(
                t(
                  'You have passed ten years, so your EPS is a pension - about {amount} a month for life from 58, at the wage cap. Your EPF savings are a separate pot; withdrawing them does not touch this.',
                ),
                { amount: inr(pc.monthlyPensionNow) },
              )}
            </p>
          ) : pc.verdict === 'withdraw_costs_pension' ? (
            <p className="mt-2 text-[16px] leading-relaxed text-ink-900">
              {fill(
                t(
                  'You are {span} short of ten years. Keep contributing and it becomes a monthly pension for life - roughly {amount} a month if you reach 58 at the wage cap. Withdraw now and that resets to zero.',
                ),
                {
                  span: monthsInWords(pc.monthsToThreshold, t),
                  amount: inr(pc.monthlyPensionAt58 ?? 0),
                },
              )}
            </p>
          ) : (
            <p className="mt-2 text-[16px] leading-relaxed text-ink-900">
              {fill(
                t(
                  'You are {span} from ten years of service. Your EPF savings are yours to withdraw; the EPS pension only begins once you cross that line.',
                ),
                { span: monthsInWords(pc.monthsToThreshold, t) },
              )}
            </p>
          )}

          <p className="mt-4 border-t border-ink-100 pt-3 text-[12.5px] leading-relaxed text-ink-500">
            {t('Source')}: {t(pc.formula.source)} · {t('published')} · {t('checked')}{' '}
            {pc.formula.sourcedAt}. {t('The monthly figure assumes the wage cap and, where it looks ahead, that you keep contributing to 58 - it is an estimate, not a guarantee. This is not financial advice.')}
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
