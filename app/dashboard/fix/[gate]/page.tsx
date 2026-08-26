import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { PROCESSES, POINTS } from '@/lib/processes';
import { fixGate, currentCaseId } from '@/app/actions';
import { Alert, ProcessList, StepIndicator, Button, ButtonLink, Tag } from '@/components/ui';
import { WhyThisNumber } from '@/components/WhyThisNumber';
import { EPFO_SCREENS } from '@/lib/epfo-screens';
import { SPEC } from '@/lib/gates/spec';
import { explain } from '@/lib/gates/explain';
import { EpfoScreenPreview } from '@/components/EpfoScreen';
import type { GateId } from '@/lib/gates/types';

const ACTOR_TEXT = {
  you: 'You can do this',
  employer: 'Your employer must act',
  epfo: 'EPFO must act',
} as const;

export default async function FixPage({ params }: { params: Promise<{ gate: string }> }) {
  const { gate } = await params;
  const proc = PROCESSES[gate as GateId];
  if (!proc) notFound();

  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');

  const g = c.resolution.gates.find((x) => x.id === proc.id);
  if (!g) notFound();

  const done = g.status === 'green';
  const points = POINTS[proc.id];
  const spec = SPEC.gates.find((x) => x.id === proc.id)!;
  const checks = explain(spec.clears, c.facts);
  const applies = explain(spec.appliesWhen, c.facts);

  const steps = c.resolution.gates
    .filter((x) => x.status !== 'not_applicable')
    .map((x) => ({
      label: x.title,
      state: x.status === 'green' ? ('done' as const) : x.id === g.id ? ('current' as const) : ('todo' as const),
    }));

  return (
    <main className="w-full max-w-[980px] px-5 pb-28 pt-7 lg:pl-9">
      <Link href="/dashboard" className="-ml-2 inline-flex min-h-[44px] items-center rounded-sm px-2 text-[14px] font-medium text-teal-700 hover:underline">
        ← Back to your gates
      </Link>

      <div className="mt-5">
        <StepIndicator steps={steps} />
      </div>

      <h1 className="mt-7 text-[34px] leading-[1.12] font-bold tracking-tight text-ink-900">
        {proc.name}
      </h1>

      {!done && g.route && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Tag tone={g.actor === 'you' ? 'success' : 'warning'}>{ACTOR_TEXT[g.actor!]}</Tag>
          <Tag>
            {g.route.latencyDays === 0 ? 'Takes a minute' : `About ${g.route.latencyDays} working days`}
          </Tag>
          {g.onCriticalPath && <Tag tone="signal">On the critical path</Tag>}
        </div>
      )}

      {!done && g.provenance && (
        <div className="mt-3 max-w-[60ch]">
          <WhyThisNumber days={g.latencyDays} provenance={g.provenance} />
        </div>
      )}

      <section className="mt-8 overflow-hidden rounded-md border-2 border-ink-100">
        <div
          className={`px-5 py-3 ${
            done ? 'bg-go-soft' : g.status === 'not_applicable' ? 'bg-ink-50' : 'bg-stop-soft'
          }`}
        >
          <p
            className={`text-[13px] font-bold uppercase tracking-[0.08em] ${
              done ? 'text-go' : g.status === 'not_applicable' ? 'text-ink-500' : 'text-stop'
            }`}
          >
            {done
              ? 'Done. Here is what we checked'
              : g.status === 'not_applicable'
                ? 'This one does not apply to you. Here is why'
                : 'What has to be true, and what your record says'}
          </p>
        </div>

        <ul className="divide-y divide-ink-100 bg-white">
          {(g.status === 'not_applicable' ? applies : checks).map((ch) => (
            <li key={ch.label} className="flex items-start gap-3 px-5 py-3">
              <span className="mt-0.5 shrink-0" aria-hidden>
                {ch.ok ? (
                  <svg width="18" height="18" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="9" fill="var(--color-go)" />
                    <path
                      d="M6 10.5l2.6 2.5L14 7.5"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="9" fill="var(--color-stop)" />
                    <path d="M7 7l6 6M13 7l-6 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                )}
              </span>
              <span className="min-w-0 flex-1 text-[16px] text-ink-800">{ch.label}</span>
              <span
                className={`shrink-0 text-[14px] font-semibold ${ch.ok ? 'text-go' : 'text-stop'}`}
              >
                {ch.actual}
              </span>
            </li>
          ))}
          {(g.status === 'not_applicable' ? applies : checks).length === 0 && (
            <li className="px-5 py-3 text-[14.5px] text-ink-500">
              There is nothing to check here. This step always applies.
            </li>
          )}
        </ul>

      </section>

      {/* the before / after that is the whole argument */}
      <section className="mt-9 grid gap-px overflow-hidden rounded-md border border-ink-100 bg-ink-100 md:grid-cols-2">
        <div className="bg-white p-5">
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-stop">
            How EPFO does it today
          </p>
          <p className="mt-3 font-mono text-[12.5px] leading-relaxed text-ink-800">
            {proc.epfoPath}
          </p>
          <p className="mt-1 break-all font-mono text-[11.5px] text-ink-400">{proc.epfoHost}</p>
          <ul className="mt-4 space-y-2.5">
            {points.breaks.map((b) => (
              <li key={b} className="flex gap-2.5 text-[15.5px] leading-relaxed text-ink-700">
                <span className="mt-[3px] shrink-0 text-stop" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.12"/><path d="M5 8h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-teal-50 p-5">
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-teal-700">
            What we do instead
          </p>
          <ul className="mt-4 space-y-2.5">
            {points.fix.map((b) => (
              <li key={b} className="flex gap-2.5 text-[15.5px] leading-relaxed text-teal-900">
                <span className="mt-[3px] shrink-0 text-teal-700" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="currentColor"/><path d="M5 8.2l2 2 4-4.4" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {proc.warning && (
        <div className="mt-5">
          <Alert tone="warning" title="The thing nobody tells you">
            {proc.warning}
          </Alert>
        </div>
      )}

      {/* the real screen, reproduced, so anyone who has used the portal recognises it */}
      <h2 className="mt-11 text-[20px] font-bold tracking-tight text-ink-900">
        The screen you would be on right now
      </h2>
      <p className="mt-2 mb-5 max-w-[68ch] text-[16px] leading-relaxed text-ink-700">
        This is {EPFO_SCREENS[proc.id].screenTitle} as EPFO presents it - the same fields, the same
        order, the same wording. Read it and then compare it with what this site asks you for
        instead.
      </p>
      <EpfoScreenPreview
        screen={EPFO_SCREENS[proc.id]}
        prefills={{
          name: c.member.epfo_name ?? c.member.display_name,
          uan: c.member.uan,
          dob: c.member.epfo_dob ?? '',
          father: c.member.epfo_father_name ?? '',
          employer: c.member.employer_name,
          exit: c.member.date_of_exit ?? '',
        }}
      />

      <h2 className="mt-11 mb-5 text-[20px] font-bold tracking-tight text-ink-900">
        {proc.explainOnly ? 'What you need to do, in order' : 'How this works here instead'}
      </h2>
      <ProcessList steps={proc.steps} />

      {proc.explainOnly && (
        <div className="mt-6">
          <Alert tone="info" title="A limit we are being straight about">
            We cannot rebuild face authentication here, and we are not going to pretend otherwise.
            This step happens inside UMANG. What we can do is make sure you go in knowing exactly
            what it will ask for.
          </Alert>
        </div>
      )}

      <div className="mt-10">
        {done ? (
          <Alert tone="success" title="Cleared">
            <p>This gate is done. Nothing here is blocking your claim any more.</p>
            <ButtonLink href="/dashboard" className="mt-4">
              Back to your gates
            </ButtonLink>
          </Alert>
        ) : g.status === 'blocked' ? (
          <Alert tone="error" title="Not yet">
            You cannot act on this one yet. Clear the gates it depends on first - the order matters,
            and attempting this now would fail.
          </Alert>
        ) : (
          <form action={fixGate}>
            <input type="hidden" name="gateId" value={proc.id} />
            <Button className="w-full sm:w-auto">
              {proc.explainOnly ? 'I have done this' : 'Mark this done'}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
