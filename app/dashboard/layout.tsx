import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { currentCaseId, signOut } from '@/app/actions';
import { Mark } from '@/components/GateList';
import { Assistant } from '@/components/Assistant';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');

  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');

  const { resolution: r, member } = c;

  return (
    <div className="mx-auto flex w-full max-w-[1280px] gap-0 px-0 lg:px-5">
      {/* sidebar */}
      <aside className="hidden w-[268px] shrink-0 border-r border-ink-100 bg-white lg:block">
        <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto px-4 py-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-teal-600">
            Signed in as
          </p>
          <p className="mt-1 text-[16px] font-bold text-ink-900">{member.display_name}</p>
          <p className="tabular text-[12.5px] text-ink-500">UAN {member.uan}</p>

          <div className="mt-4 rounded-sm bg-ink-50 px-3 py-3">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink-500">
              Time to settlement
            </p>
            <p className="tabular mt-0.5 text-[28px] font-bold leading-none text-signal">
              {r.totalDays}
              <span className="ml-1.5 text-[13px] font-semibold text-ink-500">working days</span>
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
                    href={g.status === 'not_applicable' ? '/dashboard' : `/dashboard/fix/${g.id}`}
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

          <div className="mt-7 border-t border-ink-100 pt-4">
            <Link
              href="/dashboard"
              className="block rounded-sm px-2 py-1.5 text-[13.5px] text-ink-700 hover:bg-ink-50"
            >
              Overview
            </Link>
            <Link
              href="/whats-mocked"
              className="block rounded-sm px-2 py-1.5 text-[13.5px] text-ink-700 hover:bg-ink-50"
            >
              What&rsquo;s mocked
            </Link>
            <form action={signOut}>
              <button className="block w-full rounded-sm px-2 py-1.5 text-left text-[13.5px] text-ink-700 hover:bg-ink-50">
                Switch case
              </button>
            </form>
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
