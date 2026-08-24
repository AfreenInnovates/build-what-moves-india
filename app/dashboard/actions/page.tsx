import { redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { GateList } from '@/components/GateList';
import { PageHead } from '@/components/panels';

export default async function ActionsPage() {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');

  const r = c.resolution;
  const actionable = r.gates.filter((g) => g.status === 'red');
  const blocked = r.gates.filter((g) => g.status === 'blocked');
  const cleared = r.gates.filter((g) => g.status === 'green' || g.status === 'not_applicable');

  return (
    <main className="px-5 pb-28 pt-7 lg:pl-9 lg:pr-6">
      <PageHead
        icon="actions"
        title="Action Center"
        lead="Everything standing between you and your money, in the order it has to be cleared. Each item says who has to act — you, your employer, or EPFO — and how long it takes."
      />

      <div className="mt-6 max-w-[820px] space-y-6">
        {actionable.length > 0 && (
          <section>
            <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.08em] text-stop">
              Act on these now
            </h2>
            <GateList gates={actionable} />
          </section>
        )}
        {blocked.length > 0 && (
          <section>
            <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.08em] text-wait">
              Waiting on the steps above
            </h2>
            <GateList gates={blocked} />
          </section>
        )}
        <section>
          <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.08em] text-ink-500">
            Already sorted
          </h2>
          <GateList gates={cleared} />
        </section>
      </div>
    </main>
  );
}
