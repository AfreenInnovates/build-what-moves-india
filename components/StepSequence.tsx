'use client';

export interface SequenceStep {
  label: string;
  note: string;
  ms: number;
}

/**
 * The progress panel shown while we play the steps we cannot really perform.
 *
 * It is deliberately wider than the card that launched it: inside a 460px sign-in
 * card the labels wrapped onto three lines and read as cramped. Rendering it as a
 * fixed, centred panel gives each step a single line and room for its note.
 */
export function StepSequence({
  title,
  steps,
  stage,
  footnote,
}: {
  title: string;
  steps: SequenceStep[];
  stage: number;
  footnote?: string;
}) {
  const current = steps[Math.min(stage, steps.length - 1)];
  const pct = ((stage + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/25 px-5 backdrop-blur-sm">
      <div className="w-full max-w-[640px] rounded-lg border border-ink-100 bg-white p-7 shadow-[0_20px_60px_rgba(5,81,96,0.22)] sm:p-9">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-[19px] font-bold tracking-tight text-ink-900">{title}</p>
          <p className="tabular shrink-0 text-[13px] font-semibold text-ink-400">
            Step {Math.min(stage + 1, steps.length)} of {steps.length}
          </p>
        </div>

        {/* one continuous rail, so progress reads left to right */}
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-teal-700 transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* the live step, given room to breathe */}
        <div className="mt-6 flex items-start gap-4">
          <span className="mt-0.5 shrink-0" aria-hidden>
            <svg className="animate-spin" width="26" height="26" viewBox="0 0 20 20">
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="var(--color-teal-700)"
                strokeWidth="2.5"
                strokeDasharray="38"
                strokeDashoffset="12"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[19px] font-semibold leading-snug text-ink-900">{current?.label}</p>
            <p className="mt-1 text-[14.5px] leading-relaxed text-ink-500">{current?.note}</p>
          </div>
        </div>

        {/* the rest of the sequence, one line each */}
        <ol className="mt-6 divide-y divide-ink-100 border-t border-ink-100">
          {steps.map((s, i) => {
            const state = i < stage ? 'done' : i === stage ? 'active' : 'todo';
            return (
              <li key={s.label} className="flex items-center gap-3 py-2.5">
                <span className="shrink-0" aria-hidden>
                  {state === 'done' ? (
                    <svg width="18" height="18" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="9" fill="var(--color-go)" />
                      <path d="M6 10.5l2.6 2.5L14 7.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : state === 'active' ? (
                    <svg width="18" height="18" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="9" fill="var(--color-teal-700)" />
                      <circle cx="10" cy="10" r="3.2" fill="#fff" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="8.5" fill="none" stroke="var(--color-ink-100)" strokeWidth="2" />
                    </svg>
                  )}
                </span>
                <span
                  className={`truncate text-[14.5px] ${
                    state === 'todo'
                      ? 'text-ink-300'
                      : state === 'active'
                        ? 'font-semibold text-ink-900'
                        : 'text-ink-500'
                  }`}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>

        {footnote && (
          <p className="mt-6 rounded-md bg-ink-50 px-4 py-3 text-[13px] leading-relaxed text-ink-500">
            {footnote}
          </p>
        )}
      </div>
    </div>
  );
}
