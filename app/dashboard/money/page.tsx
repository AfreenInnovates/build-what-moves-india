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
                A separate entitlement based on your years of service, not a balance you can see.{' '}
                <Link href="/dashboard/pension" className="font-semibold text-teal-700 hover:underline">
                  Tracked here <Icon name="arrow" size={14} aria-hidden />
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
