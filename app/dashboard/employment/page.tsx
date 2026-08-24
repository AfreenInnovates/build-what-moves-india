import { redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { PageHead } from '@/components/panels';
import { employment, transferStory, monthsToYM, fmtDate } from '@/lib/insights';

export default async function EmploymentPage() {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');

  const { primaryUan, rows } = employment(c);
  const story = transferStory(c);

  return (
    <main className="px-5 pb-28 pt-7 lg:pl-9 lg:pr-6">
      <PageHead
        icon="employment"
        title="My Employment"
        lead={`Every job that paid into your EPF, newest first. This is where problems are created — a missing exit date, a duplicate UAN, a gap in contributions — usually years before you notice at withdrawal.`}
      />

      <div className="mt-6 max-w-[860px]">
        <p className="mb-5 rounded-md border-l-4 border-teal-700 bg-teal-50 px-4 py-3 text-[14.5px] leading-relaxed text-teal-900">
          Your record spans <span className="font-bold">{story.employerCount}</span>{' '}
          {story.employerCount === 1 ? 'employer' : 'employers'} and{' '}
          <span className="font-bold">{monthsToYM(story.totalService)}</span> of service, from{' '}
          <span className="font-bold">{story.fromEmployer}</span> to{' '}
          <span className="font-bold">{story.toEmployer}</span>.
        </p>

        <ol className="relative space-y-4 border-l-2 border-ink-100 pl-6">
          {rows.map((e, i) => {
            const flagged = e.onSecondUan || e.exitMissing || e.gapBefore > 0;
            return (
              <li key={i} className="relative">
                <span
                  className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                    e.isCurrent ? 'bg-teal-700' : flagged ? 'bg-stop' : 'bg-go'
                  }`}
                  aria-hidden
                />
                <div
                  className={`rounded-md border bg-white px-4 py-3.5 ${
                    flagged ? 'border-stop/30' : 'border-ink-100'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[16px] font-bold text-ink-900">{e.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {e.isCurrent && (
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11.5px] font-semibold text-teal-700">
                          Current
                        </span>
                      )}
                      {e.onSecondUan && (
                        <span className="rounded-full bg-stop-soft px-2 py-0.5 text-[11.5px] font-semibold text-stop">
                          Different UAN
                        </span>
                      )}
                      {!e.isCurrent && !flagged && (
                        <span className="rounded-full bg-go-soft px-2 py-0.5 text-[11.5px] font-semibold text-go">
                          Clean
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="tabular mt-0.5 text-[13px] text-ink-500">
                    {fmtDate(e.from)} – {fmtDate(e.to)} · {monthsToYM(e.months)} · UAN {e.uan}
                  </p>

                  {e.gapBefore > 0 && (
                    <p className="mt-2 flex gap-2 rounded-sm bg-wait-soft px-3 py-2 text-[13px] text-ink-800">
                      <span aria-hidden>⚠️</span>
                      <span>
                        A <span className="font-semibold">{monthsToYM(e.gapBefore)}</span> gap sits
                        between this job and the previous one — no contributions were recorded.
                      </span>
                    </p>
                  )}
                  {e.exitMissing && (
                    <p className="mt-2 flex gap-2 rounded-sm bg-stop-soft px-3 py-2 text-[13px] text-ink-800">
                      <span aria-hidden>🚩</span>
                      <span>
                        No last-working-day is recorded here. Until it is, EPFO treats you as still
                        employed and blocks any withdrawal.
                      </span>
                    </p>
                  )}
                  {e.onSecondUan && (
                    <p className="mt-2 flex gap-2 rounded-sm bg-stop-soft px-3 py-2 text-[13px] text-ink-800">
                      <span aria-hidden>🚩</span>
                      <span>
                        This sits under a different UAN ({e.uan}) than your main one ({primaryUan}).
                        Your service is split across two numbers and must be merged.
                      </span>
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}
