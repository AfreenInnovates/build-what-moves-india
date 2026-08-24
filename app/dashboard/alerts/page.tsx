import { redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { PageHead, AlertCard } from '@/components/panels';
import { alerts } from '@/lib/insights';

export default async function AlertsPage() {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');

  const all = alerts(c);
  const order = { blocking: 0, warning: 1, info: 2, good: 3 } as const;
  const sorted = [...all].sort((a, b) => order[a.severity] - order[b.severity]);

  return (
    <main className="px-5 pb-28 pt-7 lg:pl-9 lg:pr-6">
      <PageHead
        icon="alerts"
        title="Alerts"
        lead="Everything that needs a decision or an action — contribution gaps, missing exit records, mismatches, thresholds you are near. Most weigh nothing until you try to withdraw, which is exactly when it is too late to be surprised."
      />
      <div className="mt-6 max-w-[820px] space-y-3">
        {sorted.map((a, i) => (
          <AlertCard key={i} alert={a} />
        ))}
      </div>
    </main>
  );
}
