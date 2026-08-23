import Link from 'next/link';
import type { GateId, GateStatus, ResolvedGate } from '@/lib/gates/types';
import { PROCESSES } from '@/lib/processes';

const ACTOR_LABEL = {
  you: 'you can do this',
  employer: 'your employer must do this',
  epfo: 'EPFO must do this',
} as const;

export function GateList({ gates, caseId }: { gates: ResolvedGate[]; caseId: string }) {
  const titleOf = (id: GateId) => gates.find((g) => g.id === id)?.title ?? id;

  return (
    <ol className="space-y-2">
      {gates.map((g) => (
        <GateRow key={g.id} gate={g} caseId={caseId} titleOf={titleOf} />
      ))}
    </ol>
  );
}

function GateRow({
  gate,
  caseId,
  titleOf,
}: {
  gate: ResolvedGate;
  caseId: string;
  titleOf: (id: GateId) => string;
}) {
  const actionable = gate.status === 'red' || gate.status === 'blocked';
  const waitingOn = gate.dependsOn.map(titleOf);
  const proc = PROCESSES[gate.id];

  return (
    <li
      className={`rounded-md border bg-white px-4 py-3.5 ${
        gate.onCriticalPath ? 'border-signal/35' : 'border-ink-100'
      }`}
    >
      <div className="flex gap-3">
        <Mark status={gate.status} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p
              className={`text-[15px] font-medium ${
                gate.status === 'not_applicable' ? 'text-ink-300' : 'text-ink-900'
              }`}
            >
              {gate.title}
            </p>
            {gate.onCriticalPath && (
              <span className="shrink-0 rounded-full bg-signal-soft px-2 py-0.5 text-[11px] font-semibold text-signal">
                {gate.latencyDays}d on critical path
              </span>
            )}
          </div>

          {gate.status === 'green' && <p className="mt-0.5 text-[13px] text-go">Cleared</p>}
          {gate.status === 'not_applicable' && (
            <p className="mt-0.5 text-[13px] text-ink-300">Does not apply to you</p>
          )}

          {actionable && (
            <>
              <p className="mt-1 text-[13.5px] leading-snug text-ink-700">{gate.blocks}</p>

              <div className="mt-2.5 rounded-sm bg-ink-50 px-3 py-2.5">
                <p className="text-[13.5px] leading-snug text-ink-900">{gate.route!.label}</p>
                <p className="mt-1 text-[12.5px] text-ink-500">
                  {ACTOR_LABEL[gate.actor!]} ·{' '}
                  {gate.route!.latencyDays === 0
                    ? 'takes a minute'
                    : `about ${gate.route!.latencyDays} working ${
                        gate.route!.latencyDays === 1 ? 'day' : 'days'
                      }`}
                </p>
              </div>

              {gate.status === 'blocked' ? (
                <p className="mt-2 text-[12.5px] text-wait">
                  Locked until you clear{' '}
                  {waitingOn.length === 2 ? `${waitingOn[0]} and ${waitingOn[1]}` : waitingOn.join(', ')}.
                </p>
              ) : (
                <Link
                  href={`/c/${caseId}/fix/${gate.id}`}
                  className="mt-2.5 block rounded-sm bg-teal-700 py-2.5 text-center text-[14px]
                             font-medium text-white transition hover:bg-teal-600"
                >
                  {proc.explainOnly ? 'Show me how' : 'Fix this'}
                </Link>
              )}

              {!gate.onCriticalPath && gate.status === 'red' && (
                <p className="mt-2 text-[12.5px] text-ink-500">
                  Fixing this will not move the date — something slower is ahead of it.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </li>
  );
}

/** Shape as well as colour: red/green is the most common form of colourblindness. */
export function Mark({ status }: { status: GateStatus }) {
  const shapes: Record<GateStatus, React.ReactNode> = {
    green: <circle cx="10" cy="10" r="7" fill="var(--color-go)" />,
    red: (
      <>
        <circle cx="10" cy="10" r="7" fill="var(--color-stop-soft)" />
        <path d="M10 3a7 7 0 0 1 0 14z" fill="var(--color-stop)" />
        <circle cx="10" cy="10" r="7" fill="none" stroke="var(--color-stop)" strokeWidth="1.6" />
      </>
    ),
    blocked: (
      <circle
        cx="10"
        cy="10"
        r="7"
        fill="none"
        stroke="var(--color-wait)"
        strokeWidth="1.6"
        strokeDasharray="3 2.5"
      />
    ),
    not_applicable: <circle cx="10" cy="10" r="2.5" fill="var(--color-ink-300)" />,
  };

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className="mt-0.5 shrink-0" aria-hidden>
      {shapes[status]}
    </svg>
  );
}
