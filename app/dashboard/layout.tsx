import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { Mark } from '@/components/GateList';
import { Assistant } from '@/components/Assistant';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');

  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');

  const { resolution: r, member } = c;
  const applicable = r.gates.filter((g) => g.status !== 'not_applicable').length;
  const done = r.gates.filter((g) => g.status === 'green').length;

  return (
    <div className="mx-auto flex w-full max-w-[1680px] gap-0 px-0 lg:px-6">
      {/* sidebar */}
      <aside className="hidden w-[290px] shrink-0 border-r border-ink-100 bg-white lg:block">
        <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto px-4 py-6">
          <div className="mb-5 grid grid-cols-2 gap-2">
            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 rounded-sm border-2 border-ink-100 bg-white px-2 py-2 text-[13px] font-semibold text-ink-700 transition hover:border-teal-700 hover:text-teal-700"
            >
              <span aria-hidden>←</span> Other cases
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 rounded-sm border-2 border-ink-100 bg-white px-2 py-2 text-[13px] font-semibold text-ink-700 transition hover:border-teal-700 hover:text-teal-700"
            >
              <span aria-hidden>⌂</span> Home
            </Link>
          </div>

          <p className="text-[16px] font-bold text-ink-900">
            Hello, {member.display_name.split(' ')[0]}
          </p>
          <p className="tabular text-[12.5px] text-ink-500">UAN {member.uan}</p>

          <div className="mt-4 rounded-sm bg-ink-50 px-3 py-3">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink-500">
              {done === applicable ? 'Ready to file in' : 'Your money is'}
            </p>
            <p className="tabular mt-0.5 text-[28px] font-bold leading-none text-signal">
              {r.totalDays}
              <span className="ml-1.5 text-[13px] font-semibold text-ink-500">working days away</span>
            </p>

            <div className="mt-3 flex gap-1" aria-hidden>
              {r.gates
                .filter((g) => g.status !== 'not_applicable')
                .map((g) => (
                  <span
                    key={g.id}
                    className={`h-1.5 flex-1 rounded-xs ${
                      g.status === 'green' ? 'bg-go' : 'bg-ink-100'
                    }`}
                  />
                ))}
            </div>
            <p className="mt-1.5 text-[12px] text-ink-500">
              {done} of {applicable} done
            </p>
          </div>

          <nav className="mt-6">
            <p className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink-500">
              Your gates
            </p>
            <ul className="space-y-0.5">
              {r.gates.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/dashboard/fix/${g.id}`}
                    className="flex items-start gap-2.5 rounded-sm px-2 py-2 transition hover:bg-ink-50"
                  >
                    <Mark status={g.status} />
                    <span
                      className={`text-[13.5px] leading-snug ${
                        g.status === 'not_applicable'
                          ? 'text-ink-300'
                          : g.status === 'green'
                            ? 'text-ink-500'
                            : 'font-medium text-ink-900'
                      }`}
                    >
                      {g.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-7 rounded-sm border-l-4 border-teal-700 bg-teal-50 px-3 py-3">
            <p className="text-[13px] font-bold text-teal-900">Not sure what any of this means?</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-teal-700">
              Tap <span className="font-semibold">Ask Saathi</span> at the bottom of the screen. You
              can type your question or just say it out loud.
            </p>
          </div>

        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>

      <Assistant
        member={{
          name: member.display_name,
          uan: member.uan,
          employer: member.employer_name,
          totalDays: r.totalDays,
        }}
        gates={r.gates.map((g) => ({
          id: g.id,
          title: g.title,
          status: g.status,
          blocks: g.blocks,
          actor: g.actor,
          latencyDays: g.latencyDays,
          routeLabel: g.route?.label ?? null,
          onCriticalPath: g.onCriticalPath,
        }))}
      />
    </div>
  );
}
