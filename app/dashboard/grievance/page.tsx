import { redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { currentCaseId, fileGrievanceAction, advanceGrievanceClockAction } from '@/app/actions';
import { getT } from '@/lib/i18n';
import { PageHead } from '@/components/panels';
import { Icon } from '@/components/Icon';
import { DraftPanel } from '@/components/DraftPanel';
import { LADDER, escalationState, claimClock, type RungId } from '@/lib/escalation';
import { FileWithHandoff } from '@/components/CpgramsHandoff';
import { draftFor, employerEmail } from '@/lib/drafts';
import { fill } from '@/lib/insights';

/**
 * What you do when nothing is wrong with your file and it still does not move.
 *
 * Every other screen in this product is about a record that can be corrected.
 * This one is about a claim that is correct and stuck, which is a different
 * failure with a different remedy - a ladder of grievance, appeal and RTI that
 * exists in law and that almost nobody knows the order of.
 *
 * The simulation deliberately fails. A grievance here comes back disposed with
 * the reply they actually come back with, and the product then has to deal with
 * that rather than declaring success.
 */

const DRAFT_LABELS = [
  'Subject',
  'Draft text, editable',
  'Copy the text',
  'Copied',
  'Download as a text file',
];

const HANDOFF_LABELS = [
  'Simulate sending',
  'Opening a new tab',
  'Connecting your account',
  'Account found',
  'Choosing the right category',
  'Labour & Employment → EPFO',
  'Filling the grievance form',
  'Submitting',
  'Simulation. Nothing is sent to any government system.',
  'Registered in the simulation.',
  'In reality you would now do exactly these steps yourself on the real portal - which is why the draft above is downloadable and the link beside it opens the genuine site.',
];

export default async function GrievancePage() {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');
  const t = await getT();

  const claimFiled = c.claimStatus === 'submitted';
  const state = escalationState(c.history, claimFiled);
  const draftLabels = Object.fromEntries(DRAFT_LABELS.map((k) => [k, t(k)]));
  const handoffLabels = Object.fromEntries(HANDOFF_LABELS.map((k) => [k, t(k)]));
  const clock = claimClock(c.claimSubmittedAt);
  const hr = employerEmail(c);
  const employerWork = c.resolution.gates.some(
    (g) => g.actor === 'employer' && (g.status === 'red' || g.status === 'blocked'),
  );

  return (
    <main className="px-5 pb-28 pt-7 lg:pl-9 lg:pr-6">
      <PageHead
        icon="alerts"
        title={t('If it is stuck anyway')}
        lead={t(
          'Sometimes nothing is wrong with your record and the claim still does not move. There is a ladder for that - a grievance, then an appeal, then an RTI - and each rung only opens once the one before it has failed. This drafts the words for you.',
        )}
      />

      {/* the guardrail, stated once and kept on screen */}
      <div className="mt-5 max-w-[820px] rounded-sm border-l-4 border-stop bg-stop-soft px-4 py-3">
        <p className="flex items-start gap-2 text-[14.5px] leading-snug text-ink-800">
          <Icon name="shield" size={17} className="mt-0.5 shrink-0 text-stop" aria-hidden />
          <span>
            <span className="font-bold">
              {t('Nothing on this page is transmitted to any government system.')}
            </span>{' '}
            {t(
              'Every reference number here is generated locally for the demo. The drafts are yours to copy or download and file on the real portal, which each step links to.',
            )}
          </span>
        </p>
      </div>

      <div className="mt-6 max-w-[820px] space-y-4">
        {/*
          Why a grievance is justified at all.

          A countdown that reads three days and a grievance cannot both be true.
          What makes the ladder coherent is the clock that starts at the filing
          date and keeps running past the target - so it is stated here, in days,
          before anything else on the page.
        */}
        {clock ? (
          <div
            className={`rounded-md border-l-4 px-4 py-3.5 ${
              clock.isOverdue ? 'border-stop bg-stop-soft' : 'border-teal-700 bg-teal-50'
            }`}
          >
            <p className="tabular text-[15.5px] leading-relaxed text-ink-900">
              {clock.isOverdue ? (
                <>
                  <span className="font-bold">
                    {fill(t('Your claim is {n} days past its target.'), {
                      n: String(clock.overdueBy),
                    })}
                  </span>{' '}
                  {fill(
                    t(
                      'Filed {filed} days ago against a {target}-day settlement target. It is payable and it has not been paid - which is the only situation in which any of the steps below make sense.',
                    ),
                    { filed: String(clock.elapsed), target: String(clock.target) },
                  )}
                </>
              ) : (
                fill(
                  t(
                    'Filed {filed} days ago. The {target}-day settlement target has not passed yet, so there is nothing to escalate.',
                  ),
                  { filed: String(clock.elapsed), target: String(clock.target) },
                )
              )}
            </p>
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-ink-200 px-5 py-4 text-[15px] leading-relaxed text-ink-600">
            {t(
              'You have not filed a claim yet, so the steps below are about the other thing this ladder is for: an employer or an office that will not act on a correction. The drafts change to match.',
            )}
          </p>
        )}

        <ol className="space-y-3">
          {LADDER.map((rung) => {
            const filing = state.filings.find((f) => f.rung === rung.id);
            const isNext = state.nextRung?.id === rung.id;
            const reached = filing !== undefined;
            const dim = !reached && !isNext;

            return (
              <li
                key={rung.id}
                className={`rounded-md border bg-white px-4 py-3.5 ${
                  isNext ? 'border-signal/45' : reached ? 'border-ink-100' : 'border-ink-100'
                } ${dim ? 'opacity-60' : ''}`}
              >
                <div className="flex gap-3">
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                      filing?.disposed
                        ? 'bg-stop-soft text-stop'
                        : reached
                          ? 'bg-wait-soft text-wait'
                          : isNext
                            ? 'bg-signal-soft text-signal'
                            : 'bg-ink-50 text-ink-400'
                    }`}
                  >
                    {rung.step}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="text-[16.5px] font-semibold text-ink-900">{t(rung.channel)}</p>
                      {isNext && (
                        <span className="rounded-full bg-signal-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-signal">
                          {t('your move')}
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-[14px] text-ink-600">{t(rung.where)}</p>
                    <p className="tabular mt-1 text-[13.5px] text-ink-500">
                      {t(rung.clock)} ·{' '}
                      <span className="italic">
                        {t('opens when')}: {t(rung.unlockedWhen)}
                      </span>
                    </p>
                    <p className="mt-1 text-[12.5px] text-ink-400">
                      {t('Source')}: {t(rung.provenance.source)} · {t(rung.provenance.confidence)} ·{' '}
                      {t('checked')} {rung.provenance.sourcedAt}
                    </p>

                    {/* what has happened on this rung */}
                    {filing && (
                      <div className="mt-3 rounded-sm bg-ink-50 px-3.5 py-3">
                        <p className="tabular text-[13.5px] text-ink-700">
                          {t('Simulated registration number')}:{' '}
                          <span className="font-mono font-bold text-ink-900">
                            {filing.reference}
                          </span>
                        </p>

                        {!filing.disposed ? (
                          <>
                            <p className="mt-1.5 text-[14px] text-ink-600">
                              {t('Filed. Waiting on a reply.')}
                            </p>
                            <form action={advanceGrievanceClockAction} className="mt-2.5">
                              <input type="hidden" name="rung" value={rung.id} />
                              <input
                                type="hidden"
                                name="days"
                                value={String(rung.deadlineDays ?? 30)}
                              />
                              <button
                                type="submit"
                                className="rounded-sm border-2 border-ink-200 bg-white px-4 py-2 text-[13.5px]
                                           font-semibold text-ink-700 transition hover:border-teal-700 hover:text-teal-700"
                              >
                                {fill(t('Advance the demo clock to day {n}'), {
                                  n: String(rung.deadlineDays ?? 30),
                                })}
                              </button>
                            </form>
                          </>
                        ) : (
                          <>
                            <p className="mt-2 flex flex-wrap items-center gap-2 text-[14px]">
                              <span className="rounded-full bg-stop-soft px-2.5 py-0.5 text-[12px] font-bold uppercase tracking-[0.06em] text-stop">
                                {t('Disposed')}
                              </span>
                              <span className="tabular text-ink-600">
                                {fill(t('on day {n}'), { n: String(filing.dayCount) })}
                              </span>
                            </p>
                            <blockquote className="mt-2 border-l-2 border-ink-200 pl-3 text-[14px] italic leading-relaxed text-ink-700">
                              {filing.disposalText}
                            </blockquote>
                            {/*
                              The beat this whole page exists for. Do not dress a
                              disposal up as a resolution - name what it did not
                              answer, and open the next rung.
                            */}
                            <p className="mt-2.5 text-[14.5px] font-semibold leading-snug text-stop">
                              {t(
                                'That is a disposal, not an answer. It does not give a status, a date, a reason, or a deficiency you could act on - and the claim is still not settled. This is the most common outcome, which is why the next rung exists.',
                              )}
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    {/* the draft and the exits */}
                    {isNext && rung.id !== 'wait' && (
                      <>
                        <p className="mt-3 text-[14px] leading-relaxed text-ink-600">
                          {t(draftFor(rung.id as RungId, c, state.filings).note)}
                        </p>
                        <DraftPanel
                          subject={draftFor(rung.id as RungId, c, state.filings).subject}
                          body={draftFor(rung.id as RungId, c, state.filings).body}
                          filename={`${rung.id}-${c.member.uan}.txt`}
                          labels={draftLabels}
                        />
                        <div className="mt-3 flex flex-wrap items-start gap-2">
                          {/*
                            Rungs that leave EPFO get the handoff played out.
                            The seam between two departments' portals is the part
                            people actually give up at, so it is shown rather
                            than collapsed into a button.
                          */}
                          {rung.href ? (
                            <div className="w-full max-w-[520px]">
                              <FileWithHandoff
                                action={fileGrievanceAction}
                                rung={rung.id}
                                host={new URL(rung.href).hostname}
                                uanTail={c.member.uan.slice(-4)}
                                subject={draftFor(rung.id as RungId, c, state.filings).subject}
                                labels={handoffLabels}
                              />
                            </div>
                          ) : (
                            <form action={fileGrievanceAction}>
                              <input type="hidden" name="rung" value={rung.id} />
                              <button
                                type="submit"
                                className="rounded-sm bg-teal-700 px-5 py-2.5 text-[14px] font-bold text-white
                                           transition hover:bg-teal-600"
                              >
                                {t('Simulate sending')}
                              </button>
                            </form>
                          )}
                          {rung.href && (
                            <a
                              href={rung.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-sm border-2 border-ink-100 bg-white
                                         px-4 py-2.5 text-[13.5px] font-semibold text-ink-700 transition
                                         hover:border-teal-700 hover:text-teal-700"
                            >
                              {t('File it for real on')} {new URL(rung.href).hostname}
                              <Icon name="arrow" size={14} aria-hidden />
                            </a>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* the employer track, which runs beside the ladder rather than on it */}
        {employerWork && (
          <section className="rounded-md border border-ink-100 bg-white px-4 py-3.5">
            <h2 className="text-[16.5px] font-semibold text-ink-900">
              {t('Alongside all of this: the employer')}
            </h2>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-600">
              {t(
                'Some of what is holding your claim can only be done by your old company, and no grievance makes them faster. This one runs in parallel - send it today and it costs you nothing.',
              )}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-600">{t(hr.note)}</p>
            <DraftPanel
              subject={hr.subject}
              body={hr.body}
              filename={`employer-${c.member.uan}.txt`}
              labels={draftLabels}
            />
          </section>
        )}
      </div>
    </main>
  );
}
