import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { PROCESSES } from '@/lib/processes';
import { fixGate, currentCaseId } from '@/app/actions';
import { Alert, ProcessList, StepIndicator, Button, ButtonLink, Tag } from '@/components/ui';
import { EPFO_SCREENS } from '@/lib/epfo-screens';
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

  const steps = c.resolution.gates
    .filter((x) => x.status !== 'not_applicable')
    .map((x) => ({
      label: x.title,
      state: x.status === 'green' ? ('done' as const) : x.id === g.id ? ('current' as const) : ('todo' as const),
    }));

  return (
    <main className="mx-auto w-full max-w-[860px] px-5 pb-28 pt-7">
      <Link href="/dashboard" className="text-[14px] font-medium text-teal-700 hover:underline">
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
          <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{proc.breaks}</p>
        </div>
        <div className="bg-teal-50 p-5">
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-teal-700">
            What we do instead
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-teal-900">{proc.fix}</p>
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
      <p className="mt-2 mb-5 max-w-[68ch] text-[15px] leading-relaxed text-ink-700">
        This is {EPFO_SCREENS[proc.id].screenTitle} as EPFO presents it — the same fields, the same
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
            You cannot act on this one yet. Clear the gates it depends on first — the order matters,
            and attempting this now would fail.
          </Alert>
        ) : (
          <form action={fixGate}>
            <input type="hidden" name="gateId" value={proc.id} />
            <Button className="w-full sm:w-auto">
              {proc.explainOnly ? 'I have done this' : 'Mark this done'}
            </Button>
            <p className="mt-3 text-[13.5px] text-ink-500">
              Saved to your case. Refreshing will not undo it.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
