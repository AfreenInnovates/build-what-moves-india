import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { getT } from '@/lib/i18n';
import { fill } from '@/lib/insights';
import { PageHead, StatTile } from '@/components/panels';
import { money, pension, employment, contributionTimeline, inr, monthsToYM, fmtDate } from '@/lib/insights';
import { MoneyTimeline } from '@/components/MoneyTimeline';
import { passbookBreakdown, withdrawalTds } from '@/lib/pension';
import { monthsInWords } from '@/lib/insights';

export default async function MoneyPage() {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');
  const t = await getT();

  const m = money(c);
  const p = pension(c);
  const { rows } = employment(c);
  const timeline = contributionTimeline(c);
  const pb = passbookBreakdown(c);
  const tds = withdrawalTds(c);

  return (
    <main className="px-5 pb-28 pt-7 lg:pl-9 lg:pr-6">
      <PageHead
        icon="money"
        title={t("My Money")}
        lead={t("What has built up in your EPF, and where it came from. Your savings (EPF) and your pension (EPS) are two separate pots from the same monthly deduction - this page is the savings pot.")}
      />

      <div className="mt-6 max-w-[860px] space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label={t('EPF balance')} value={inr(m.balance)} tone="go" sub={t('Your withdrawable savings')} />
          <StatTile label={t('Across')} value={monthsToYM(p.serviceMonths)} sub={t('of recorded service')} />
          <StatTile
            label={t('Rough monthly build-up')}
            value={inr(m.monthlyEstimate)}
            sub={t('Estimate: balance ÷ months')}
          />
        </div>

        <MoneyTimeline t={t} data={timeline} />

        {/*
          The two questions every member asks and the portal answers nowhere:
          "why is my passbook less than my salary slip" and "where is my interest".
          Both are pure explanation of a fact, which is exactly what this product
          is for - no model, no computation the member cannot check.
        */}
        <section className="rounded-md border border-ink-100 bg-white p-5" data-tour="passbook">
          <h2 className="text-[16px] font-bold text-ink-900">
            {t('Why your passbook shows less than your salary slip')}
          </h2>
          <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-700">
            {fill(
              t(
                'Of your employer’s 12%, up to {cap} a month is diverted to your EPS pension - and a pension is not a balance you can watch grow or withdraw. So money is not missing; it is in a second pot with different rules.',
              ),
              { cap: inr(pb.monthlyEpsDiversion) },
            )}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-sm border border-go/30 bg-go-soft px-4 py-3.5">
              <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-go">
                {t('In your passbook · EPF')}
              </p>
              <p className="tabular mt-1 text-[22px] font-bold text-ink-900">{inr(pb.epfBalance)}</p>
              <p className="mt-0.5 text-[13px] text-ink-600">{t('Withdrawable, and earns interest')}</p>
            </div>
            <div className="rounded-sm border border-teal-200 bg-teal-50 px-4 py-3.5">
              <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-teal-700">
                {t('Not in your passbook · EPS')}
              </p>
              <p className="tabular mt-1 text-[22px] font-bold text-ink-900">
                ≈ {inr(pb.epsPotEstimate)}
              </p>
              <p className="mt-0.5 text-[13px] text-ink-600">
                {t('A pension, not a lump sum - estimated at the cap over your service')}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[13px] font-bold uppercase tracking-[0.06em] text-ink-500">
            {t('And if your interest has not appeared')}
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-ink-700">
            {t('EPF interest is declared once a year and credited in one pass, backdated to 31 March. The passbook entry can lag by weeks - you lose nothing, it arrives dated to the year end.')}
          </p>
          <p className="mt-3 border-t border-ink-100 pt-2.5 text-[12.5px] text-ink-500">
            {t('Source')}: {t(pb.split.source)} · {t('published')} · {t('checked')} {pb.split.sourcedAt}.{' '}
            {t('The EPS figure is an illustration at the wage cap, not a statement of your pension pot.')}
          </p>
        </section>

        {/*
          What tax is cut if you withdraw now.

          The "what will I actually receive" half of the pre-filing question. Shown
          to everyone: a member past five years sees the reassurance that nothing
          is cut; one under it sees the number, and the two ways out.
        */}
        <section
          className={`rounded-md border p-5 ${
            tds.reason === 'will_be_cut' ? 'border-signal/30 bg-white' : 'border-ink-100 bg-white'
          }`}
          data-tour="tds"
        >
          <h2 className="text-[16px] font-bold text-ink-900">
            {t('What tax is cut if you withdraw now')}
          </h2>

          {tds.reason === 'will_be_cut' ? (
            <>
              <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-signal">
                    {fill(t('TDS at {rate}%'), { rate: String(tds.ratePct) })}
                  </p>
                  <p className="tabular text-[24px] font-bold leading-tight text-signal">
                    − {inr(tds.tdsAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-go">
                    {t('You would receive')}
                  </p>
                  <p className="tabular text-[24px] font-bold leading-tight text-ink-900">
                    {inr(tds.netIfWithdrawNow)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink-700">
                {fill(
                  t(
                    'Because you have under five years of continuous service, tax is cut on a withdrawal over {threshold}. You have two ways to keep it: file Form 15G if your total income is below the taxable limit, or wait the {span} until you cross five years, after which none is cut.',
                  ),
                  { threshold: inr(50000), span: monthsInWords(tds.monthsToExempt, t) },
                )}
              </p>
            </>
          ) : tds.reason === 'exempt_five_years' ? (
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-700">
              {t(
                'You have over five years of continuous service, so no tax is cut on your withdrawal - you receive the full balance.',
              )}
            </p>
          ) : tds.reason === 'exempt_15g' ? (
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-700">
              {t(
                'You are under five years of service, but your Form 15G is on file, so no tax is cut - you receive the full balance.',
              )}
            </p>
          ) : (
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-700">
              {fill(
                t(
                  'Your balance is under {threshold}, so no tax is cut on a withdrawal even though you are under five years of service.',
                ),
                { threshold: inr(50000) },
              )}
            </p>
          )}

          <p className="mt-3 border-t border-ink-100 pt-2.5 text-[12.5px] text-ink-500">
            {t('Source')}: {t(tds.provenance.source)} · {t('published')} · {t('checked')}{' '}
            {tds.provenance.sourcedAt}. {t('This is an estimate to help you decide, not a tax computation. This is not financial advice.')}
          </p>
        </section>

        <section className="rounded-md border border-ink-100 bg-white p-5">
          <h2 className="text-[16px] font-bold text-ink-900">{t('Two pots, one deduction')}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-sm bg-go-soft px-4 py-3.5">
              <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-go">{t('EPF · savings')}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-ink-800">
                {fill(t('A lump sum you can withdraw. This is the {amount} above. It earns interest each year.'), {
                  amount: inr(m.balance),
                })}
              </p>
            </div>
            <div className="rounded-sm bg-teal-50 px-4 py-3.5">
              <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-teal-700">{t('EPS · pension')}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-ink-800">
                {t('A separate entitlement based on your years of service, not a balance you can see.')}{' '}
                <Link href="/dashboard/pension" className="font-semibold text-teal-700 hover:underline">
                  {t('Tracked here')} <Icon name="arrow" size={14} aria-hidden />
                </Link>
              </p>
            </div>
          </div>
          <p className="mt-3 text-[12.5px] text-ink-500">
            {t('The monthly figure is an illustration - total balance spread evenly over your service. Real contributions vary with salary and are not published per member.')}
          </p>
        </section>

        <section className="rounded-md border border-ink-100 bg-white p-5">
          <h2 className="text-[16px] font-bold text-ink-900">{t('Where it came from')}</h2>
          <ul className="mt-3 divide-y divide-ink-100">
            {rows.map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-medium text-ink-900">{e.name}</p>
                  <p className="tabular text-[12.5px] text-ink-500">
                    {fmtDate(e.from)} – {fmtDate(e.to)}
                  </p>
                </div>
                <span className="tabular shrink-0 text-[14px] font-semibold text-ink-700">
                  {monthsToYM(e.months)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] text-ink-500">
            {t('Contributions from every employer belong in one account. If any sits under a second UAN, it is not counted here until merged.')}
          </p>
        </section>
      </div>
    </main>
  );
}
