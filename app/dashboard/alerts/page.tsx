import { redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { getT } from '@/lib/i18n';
import { PageHead, AlertCard } from '@/components/panels';
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
      <div className="mt-6 max-w-[820px] space-y-3">
        {sorted.map((a, i) => (
          <AlertCard key={i} alert={a} t={t} />
        ))}
      </div>
    </main>
  );
}
