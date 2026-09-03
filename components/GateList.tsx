import Link from 'next/link';
import { Icon } from './Icon';
import type { GateId, GateStatus, ResolvedGate } from '@/lib/gates/types';
import type { ScheduleBar } from '@/lib/schedule';
import { PROCESSES } from '@/lib/processes';
import { fill } from '@/lib/insights';
import { WhyThisNumber } from './WhyThisNumber';

const ACTOR_LABEL = {
  you: 'you can do this',
  employer: 'your employer must do this',
  epfo: 'EPFO must do this',
} as const;

type T = (s: string) => string;

export function GateList({
  gates,
  t,
  timing,
}: {
  gates: ResolvedGate[];
  t?: T;
  /** where each gate sits on the schedule, from lib/schedule */
  timing?: Map<GateId, ScheduleBar>;
}) {
  const tr = t ?? ((s: string) => s);
  const delay = (i: number) => `rise rise-${Math.min(i + 1, 5)}`;
  const titleOf = (id: GateId) => tr(gates.find((g) => g.id === id)?.title ?? id);

  return (
    <ol className="space-y-2">
      {gates.map((g, i) => (
        <div key={g.id} className={delay(i)}>
          <GateRow gate={g} titleOf={titleOf} t={tr} bar={timing?.get(g.id)} />
        </div>
      ))}
    </ol>
  );
}

function GateRow({
  gate,
  titleOf,
  t,
  bar,
}: {
  gate: ResolvedGate;
  titleOf: (id: GateId) => string;
  t: T;
  bar?: ScheduleBar;
}) {
  const actionable = gate.status === 'red' || gate.status === 'blocked';
  const waitingOn = gate.dependsOn.map(titleOf);
  const proc = PROCESSES[gate.id];

  return (
    <li
      data-gate={gate.id}
      className={`scroll-mt-24 rounded-md border bg-white px-4 py-3.5 ${
        gate.onCriticalPath ? 'border-signal/35' : 'border-ink-100'
      }`}
    >
      <div className="flex gap-3">
        <Mark status={gate.status} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p
              className={`text-[16.5px] font-semibold ${
                gate.status === 'not_applicable' ? 'text-ink-300' : 'text-ink-900'
              }`}
            >
              {t(gate.title)}
            </p>
            {gate.onCriticalPath && (
              <span className="shrink-0 rounded-full bg-signal-soft px-2 py-0.5 text-[11px] font-semibold text-signal">
                {gate.latencyDays}d {t('on critical path')}
              </span>
            )}
          </div>

          {(gate.status === 'green' || gate.status === 'not_applicable') && (
            <div className="mt-0.5 flex flex-wrap items-center gap-3">
              <p className={`text-[13px] ${gate.status === 'green' ? 'text-go' : 'text-ink-400'}`}>
                {gate.status === 'green' ? t('Cleared') : t('Does not apply to you')}
              </p>
              <Link
                href={`/dashboard/fix/${gate.id}`}
                className="inline-flex min-h-[24px] items-center text-[13px] font-semibold text-teal-700 hover:underline"
              >
                {t('See what was checked')} <Icon name="arrow" size={14} aria-hidden />
              </Link>
            </div>
          )}

          {actionable && (
            <>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-700">{t(gate.blocks)}</p>

              <div className="mt-2.5 rounded-sm bg-ink-50 px-3 py-2.5">
                <p className="text-[15px] leading-snug text-ink-900">{t(gate.route!.label)}</p>
                {/*
                  One sentence, one dictionary entry.

                  This used to be glued together from t('about'), the number and
                  t('working') + t('days'). English survives that; Kannada does
                  not - "about" is a postposition there, so the parts came back
                  correct individually and the line read as nonsense. A whole
                  sentence with a {n} slot is the only version a translator can
                  actually put in the right order.
                */}
                <p className="mt-1 text-[13.5px] text-ink-500">
                  {t(ACTOR_LABEL[gate.actor!])} ·{' '}
                  {gate.route!.latencyDays === 0
                    ? t('takes a minute')
                    : fill(
                        gate.route!.latencyDays === 1
                          ? t('about {n} working day')
                          : t('about {n} working days'),
                        { n: String(gate.route!.latencyDays) },
                      )}
                </p>
              </div>

              {gate.provenance && (
                <WhyThisNumber days={gate.latencyDays} provenance={gate.provenance} t={t} />
              )}

              {/*
                What delay costs, rather than what finishing "saves".

                The earlier wording - "finish this and your money comes 5 days
                sooner" - read as though the five days evaporated on a button
                press. They do not. The latency is already inside the total; what
                a member actually controls is the day the clock starts. So the
                critical path is framed as the cost of waiting, and slack is
                framed as the room you genuinely have.
              */}
              {bar &&
                (bar.slack === 0 ? (
                  <p className="mt-2.5 flex items-start gap-2 rounded-sm bg-signal-soft px-3 py-2 text-[14.5px] leading-snug text-signal">
                    <Icon name="clock" size={16} className="mt-0.5 shrink-0" aria-hidden />
                    <span>
                      <span className="font-bold">{t('Start this today.')}</span>{' '}
                      {fill(
                        t(
                          'Its {days} days are already inside your total - but they only begin when you do, so every day you wait adds a day.',
                        ),
                        { days: String(gate.latencyDays) },
                      )}
                    </span>
                  </p>
                ) : (
                  <p className="mt-2.5 text-[14px] leading-relaxed text-ink-500">
                    {fill(
                      t(
                        'No rush on this one. It has {n} days of room - done within {n} days it costs you nothing, because something slower is running alongside it.',
                      ),
                      { n: String(bar.slack) },
                    )}
                  </p>
                ))}

              {gate.status === 'blocked' ? (
                <>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-wait">
                    {t('Locked until you clear')}{' '}
                    {waitingOn.length === 2
                      ? `${waitingOn[0]} ${t('and')} ${waitingOn[1]}`
                      : waitingOn.join(', ')}
                    .
                  </p>
                  <Link
                    href={`/dashboard/fix/${gate.id}`}
                    className="mt-2 inline-flex min-h-[24px] items-center text-[13px] font-semibold text-teal-700 hover:underline"
                  >
                    {t('See what it will check')} <Icon name="arrow" size={14} aria-hidden />
                  </Link>
                </>
              ) : (
                <Link
                  href={`/dashboard/fix/${gate.id}`}
                  className="mt-3 inline-block rounded-sm bg-teal-700 px-6 py-2.5 text-center
                             text-[14px] font-bold text-white transition hover:bg-teal-600"
                >
                  {proc.explainOnly ? t('Show me how') : t('Fix this')}
                </Link>
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
