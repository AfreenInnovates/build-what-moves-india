import { redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { PageHead } from '@/components/panels';
import {
  employment,
  transferStory,
  monthsToYM,
  monthsInWords,
  fmtDate,
  ordinal,
} from '@/lib/insights';
import { Icon } from '@/components/Icon';

export default async function EmploymentPage() {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');

  const { primaryUan, rows } = employment(c);
  const story = transferStory(c);

  // rows arrive newest-first; the earliest problem is the last flagged one
  const flaggedRows = rows.filter((e) => e.onSecondUan || e.exitMissing || e.gapBefore > 0);
  const earliest = flaggedRows.at(-1) ?? null;

  return (
    <main className="px-5 pb-28 pt-7 lg:pl-9 lg:pr-6">
      <PageHead
        icon="employment"
        title="My Employment"
        lead={`Every job that paid into your PF, newest first. Problems are almost always created here, at one particular company, years before anyone tells you. This page says which job, and how long it has been sitting there.`}
      />

      <div className="mt-6 max-w-[860px]">
        <p className="mb-4 rounded-md border-l-4 border-teal-700 bg-teal-50 px-4 py-3 text-[14.5px] leading-relaxed text-teal-900">
          Your record spans <span className="font-bold">{story.employerCount}</span>{' '}
          {story.employerCount === 1 ? 'job' : 'jobs'} and{' '}
          <span className="font-bold">{monthsToYM(story.totalService)}</span> of work, from{' '}
          <span className="font-bold">{story.fromEmployer}</span> to{' '}
          <span className="font-bold">{story.toEmployer}</span>.
        </p>

        {/*
          The point of this page. Not "something is wrong" but "it went wrong
          here, this long ago, and nothing told you" - which is the part people
          are angriest about once they find out.
        */}
        {earliest && (
          <div className="mb-6 rounded-lg border-l-4 border-stop bg-stop-soft px-4 py-3.5">
            <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.07em] text-stop">
              <Icon name="alerts" size={15} aria-hidden />
              Where it first went wrong
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-800">
              The earliest problem on your record starts at{' '}
              <span className="font-bold">{earliest.name}</span>, your{' '}
              <span className="font-bold">
                {ordinal(earliest.position)} job out of {story.employerCount}
              </span>
              {earliest.problemAgeMonths !== null && (
                <>
                  {' '}
                  - and it has been sitting there for{' '}
                  <span className="font-bold">{monthsInWords(earliest.problemAgeMonths)}</span>
                </>
              )}
              . Nothing would have told you until the day your claim was refused.
            </p>
            {flaggedRows.length > 1 && (
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-700">
                {flaggedRows.length} of your {story.employerCount} jobs have something that needs
                fixing. They are marked below.
              </p>
            )}
          </div>
        )}

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
                    <p className="text-[16px] font-bold text-ink-900">
                      <span className="tabular mr-2 rounded-sm bg-ink-50 px-1.5 py-0.5 text-[12.5px] font-bold text-ink-500">
                        Job {e.position}
                      </span>
                      {e.name}
                    </p>
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
                  <p className="tabular mt-1 text-[13px] text-ink-500">
                    {fmtDate(e.from)} – {fmtDate(e.to)} · {monthsToYM(e.months)} · UAN {e.uan}
                  </p>

                  {flagged && e.problemAgeMonths !== null && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-stop-soft px-2.5 py-1 text-[13px] font-semibold text-stop">
                      <Icon name="alerts" size={13} aria-hidden />
                      Wrong for {monthsInWords(e.problemAgeMonths)} without anyone telling you
                    </p>
                  )}

                  {e.gapBefore > 0 && (
                    <p className="mt-2 flex gap-2 rounded-sm bg-wait-soft px-3 py-2 text-[13px] text-ink-800">
                      <Icon name="alerts" size={15} className="mt-0.5 shrink-0 text-wait" aria-hidden />
                      <span>
                        For <span className="font-semibold">{monthsInWords(e.gapBefore)}</span> before
                        you started here, nothing was paid into your PF. Those months do not count
                        towards your pension.
                      </span>
                    </p>
                  )}
                  {e.exitMissing && (
                    <p className="mt-2 flex gap-2 rounded-sm bg-stop-soft px-3 py-2 text-[13px] text-ink-800">
                      <Icon name="alerts" size={15} className="mt-0.5 shrink-0 text-stop" aria-hidden />
                      <span>
                        Nobody recorded the day you left this job. Until someone does, EPFO counts
                        you as still working here and will not release your money.
                      </span>
                    </p>
                  )}
                  {e.onSecondUan && (
                    <p className="mt-2 flex gap-2 rounded-sm bg-stop-soft px-3 py-2 text-[13px] text-ink-800">
                      <Icon name="alerts" size={15} className="mt-0.5 shrink-0 text-stop" aria-hidden />
                      <span>
                        This job was put under a different PF number ({e.uan}) instead of your main
                        one ({primaryUan}). Your savings and your years are split across two
                        accounts, and they have to be joined back together.
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
