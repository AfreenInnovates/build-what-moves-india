import { redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { getT } from '@/lib/i18n';
import { PageHead, AlertCard } from '@/components/panels';
import { Icon } from '@/components/Icon';
import { alerts } from '@/lib/insights';

export default async function AlertsPage() {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');
  const t = await getT();

  const all = alerts(c, t);
  const order = { blocking: 0, warning: 1, info: 2, good: 3 } as const;
  const sorted = [...all].sort((a, b) => order[a.severity] - order[b.severity]);

  return (
    <main className="px-5 pb-28 pt-7 lg:pl-9 lg:pr-6">
      <PageHead
        icon="alerts"
        title={t("Alerts")}
        lead={t("Everything waiting on a decision from you: months with no money paid in, a leaving date nobody recorded, details that do not match, and lines you are close to crossing. Most of these cost you nothing until the day you ask for your money, which is the worst possible moment to find out.")}
      />
      {/*
        Why the order matters.

        The list is sorted, and a sorted list that does not say why reads as
        arbitrary - or worse, as "most important first", which is not what this
        is. It is "most expensive first", and the difference is the whole
        argument: an item can be serious and cost you nothing this week.
      */}
      <section className="mt-6 max-w-[820px] rounded-md border-l-4 border-teal-700 bg-teal-50 px-4 py-3.5">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-teal-900">
          <Icon name="route" size={17} aria-hidden /> {t('Why this order')}
        </h2>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-800">
          {t(
            'This is not sorted by how serious each thing is. It is sorted by what it costs you in days. Anything blocking your money comes first, and within that, whatever sits on the critical path - the chain of waiting that decides your date - comes before anything running alongside it.',
          )}
        </p>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-800">
          {t(
            'So the top of this list is the thing to start today. Something further down can still matter a great deal and cost you nothing extra, because it finishes inside a wait that is already running.',
          )}
        </p>
      </section>

      <div className="mt-4 max-w-[820px] space-y-3">
        {sorted.map((a, i) => (
          <AlertCard key={i} alert={a} t={t} />
        ))}
      </div>
    </main>
  );
}
