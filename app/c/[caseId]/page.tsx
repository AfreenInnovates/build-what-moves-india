import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { GateList } from '@/components/GateList';
import { Countdown } from '@/components/Countdown';
import { resetProgress } from '@/app/actions';
import { ButtonLink } from '@/components/ui';

export default async function CasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const c = await loadCase(caseId).catch(() => null);
  if (!c) notFound();

  const { resolution: r, member } = c;
  const startGate = r.gates.find((g) => g.id === r.startToday);
  const cleared = c.history.filter((e) => e.type === 'gate_cleared');

  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 pb-24 pt-6">
      <header className="flex items-start justify-between gap-4 border-b border-ink-100 pb-5">
        <div className="min-w-0">
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-teal-600">
            Your claim
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight text-ink-900">
            {member.display_name}
          </h1>
          <p className="tabular mt-0.5 text-[14px] text-ink-500">
            UAN {member.uan} · {member.employer_name}
          </p>
        </div>
        <form action={resetProgress}>
          <input type="hidden" name="caseId" value={caseId} />
          <button className="rounded-sm border-2 border-ink-100 bg-white px-4 py-2 text-[14px] font-semibold text-ink-700 transition hover:border-ink-300">
            Reset
          </button>
        </form>
      </header>

      <div className="mt-7 grid gap-7 lg:grid-cols-[380px_1fr] lg:items-start">
        {/* summary rail — stays put while the gates scroll */}
        <div className="space-y-4 lg:sticky lg:top-20">
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
                  href={`/c/${caseId}/fix/${startGate.id}`}
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
                {cleared.slice(0, 5).map((e, i) => {
                  const saved = (e.payload as { saved?: number } | null)?.saved ?? 0;
                  return (
                    <li key={i} className="flex justify-between gap-3 text-[14px]">
                      <span className="text-ink-700">{e.payload?.label}</span>
                      <span
                        className={
                          saved > 0 ? 'tabular shrink-0 font-semibold text-go' : 'shrink-0 text-ink-400'
                        }
                      >
                        {saved > 0 ? `−${saved} days` : 'no time saved'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="rounded-md border-l-4 border-teal-700 bg-teal-50 px-4 py-3.5">
            <p className="text-[14px] leading-relaxed text-teal-900">
              This page has its own address. Bookmark it, send it to someone, or come back next week
              — your progress is saved.
            </p>
            <p className="mt-2 break-all font-mono text-[11.5px] text-teal-700">/c/{caseId}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-teal-700">
              Every link inside EPFO carries a one-time session token, so not a single page there can
              be bookmarked or shared.
            </p>
          </section>
        </div>

        {/* the spine */}
        <div>
          <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-ink-500">
            The seven gates, in dependency order
          </h2>
          <GateList gates={r.gates} caseId={caseId} />

          <p className="pt-6 text-[13px] leading-relaxed text-ink-500">
            Computed by the gate resolver from spec {r.specVersion}. Progress is stored in Postgres,
            so refreshing or closing the tab loses nothing.{' '}
            <Link href="/whats-mocked" className="underline hover:text-teal-600">
              What is mocked
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
