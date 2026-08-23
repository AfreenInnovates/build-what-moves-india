import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { GateList } from '@/components/GateList';
import { Countdown } from '@/components/Countdown';
import { ButtonLink } from '@/components/ui';

export default async function DashboardPage() {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');

  const { resolution: r, member } = c;
  const startGate = r.gates.find((g) => g.id === r.startToday);
  const cleared = c.history.filter((e) => e.type === 'gate_cleared');

  return (
    <main className="px-5 pb-28 pt-7 lg:pl-8">
      <div className="border-b border-ink-100 pb-5">
        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-teal-600">
          Your claim
        </p>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight text-ink-900">
          {member.display_name}
        </h1>
        <p className="tabular mt-0.5 text-[14px] text-ink-500">
          UAN {member.uan} · {member.employer_name}
        </p>
      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-[360px_1fr] xl:items-start">
        <div className="space-y-4 xl:sticky xl:top-20">
          <section className="rounded-md border border-ink-100 bg-white shadow-[0_1px_2px_rgba(16,20,24,0.04)]">
            <Countdown
              days={r.totalDays}
              from={c.previousDays}
              blocking={r.blockingCount}
              total={r.gates.length}
            />

            {startGate && (
              <div className="mx-5 mb-5 rounded-sm border-l-4 border-teal-700 bg-teal-50 px-4 py-3.5">
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-teal-700">
                  Start today
                </p>
                <p className="mt-1.5 text-[15.5px] leading-snug text-teal-900">
                  {startGate.route!.label}
                </p>
                <p className="mt-1.5 text-[13.5px] leading-snug text-teal-700">
                  It has the longest wait, so starting it first is what actually moves the date.
                </p>
                <ButtonLink
                  href={`/dashboard/fix/${startGate.id}`}
                  className="mt-3.5 px-5 py-2.5 text-[14px]"
                >
                  Open this
                </ButtonLink>
              </div>
            )}
          </section>

          {cleared.length > 0 && (
            <section className="rounded-md border border-ink-100 bg-white px-4 py-3.5">
              <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink-500">
                What has changed
              </p>
              <ul className="mt-2.5 space-y-2">
                {cleared.slice(0, 6).map((e, i) => {
                  const saved = (e.payload as { saved?: number } | null)?.saved ?? 0;
                  return (
                    <li key={i} className="flex justify-between gap-3 text-[14px]">
                      <span className="text-ink-700">{e.payload?.label}</span>
                      <span
                        className={
                          saved > 0
                            ? 'tabular shrink-0 font-semibold text-go'
                            : 'shrink-0 text-ink-400'
                        }
                      >
                        {saved > 0 ? `−${saved} days` : 'no time saved'}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 border-t border-ink-100 pt-2.5 text-[12.5px] leading-relaxed text-ink-500">
                Saved permanently. Close the tab, come back next week, and this is exactly where you
                left it.
              </p>
            </section>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-ink-500">
            The seven gates, in dependency order
          </h2>
          <GateList gates={r.gates} />

          <p className="pt-6 text-[13px] leading-relaxed text-ink-500">
            Computed by the gate resolver from spec {r.specVersion}, and stored in Postgres.{' '}
            <Link href="/whats-mocked" className="underline hover:text-teal-600">
              What is mocked
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
