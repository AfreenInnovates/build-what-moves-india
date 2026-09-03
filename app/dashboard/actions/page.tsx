import { redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { GateList } from '@/components/GateList';
import { CriticalPathTimeline } from '@/components/CriticalPathTimeline';
import { getT } from '@/lib/i18n';
import { PageHead } from '@/components/panels';
import { schedule, savings } from '@/lib/schedule';
import type { GateId } from '@/lib/gates/types';

export default async function ActionsPage() {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');
  const t = await getT();

  const r = c.resolution;
  const plan = schedule(r);
  const timing = new Map((plan?.bars ?? []).map((b) => [b.gate.id, b]));

  /**
   * Most costly first.
   *
   * Sorting by gate id put the thing worth doing today wherever the spec happened
   * to declare it, while `Start today` named it in prose immediately above. The
   * list now agrees with the sentence.
   */
  const saved = savings(r);
  const rank = (id: GateId) => saved.get(id) ?? 0;

  const actionable = r.gates
    .filter((g) => g.status === 'red')
    .sort((a, b) => rank(b.id) - rank(a.id) || b.latencyDays - a.latencyDays);
  const blocked = r.gates
    .filter((g) => g.status === 'blocked')
    .sort((a, b) => rank(b.id) - rank(a.id) || b.latencyDays - a.latencyDays);
  const cleared = r.gates.filter((g) => g.status === 'green' || g.status === 'not_applicable');

  return (
    <main className="px-5 pb-28 pt-7 lg:pl-9 lg:pr-6">
      <PageHead
        icon="actions"
        title={t('Action Center')}
        lead={t(
          "Everything standing between you and your money, in the order it has to be cleared. Each item says who has to act - you, your employer, or EPFO - and how long it takes.",
        )}
      />

      <div className="mt-6 max-w-[820px] space-y-6">
        {plan && <CriticalPathTimeline data={plan} t={t} />}

        {actionable.length > 0 && (
          <section>
            <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.08em] text-stop">
              {t('Act on these now')}
            </h2>
            <GateList gates={actionable} t={t} timing={timing} />
          </section>
        )}
        {blocked.length > 0 && (
          <section>
            <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.08em] text-wait">
              {t('Waiting on the steps above')}
            </h2>
            <GateList gates={blocked} t={t} timing={timing} />
          </section>
        )}
        <section>
          <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.08em] text-ink-500">
            {t('Already sorted')}
          </h2>
          <GateList gates={cleared} t={t} />
        </section>
      </div>
    </main>
  );
}
