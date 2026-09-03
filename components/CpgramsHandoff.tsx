'use client';

import { useRef, useState } from 'react';
import { Icon } from './Icon';

/**
 * The jump to the other department's portal, shown rather than described.
 *
 * EPFiGMS is EPFO's own desk. CPGRAMS is a different department entirely, with
 * its own login, its own form, and a category tree a member has to guess their
 * way down before they can even describe the problem. That handoff is where
 * people give up, so this plays it out step by step instead of turning a button
 * green.
 *
 * It is a simulation and it says so on every frame. Nothing is transmitted; the
 * draft is downloadable and the real portal is one click away. The theatre is
 * there to make the seam visible, not to imply we crossed it.
 */

interface Step {
  label: string;
  detail?: string;
  ms: number;
}

export function CpgramsHandoff({
  host,
  uanTail,
  subject,
  onDone,
  labels,
}: {
  host: string;
  /** last four of the UAN, so the "account found" step is about this member */
  uanTail: string;
  subject: string;
  /** fires once the sequence finishes - this is what records the filing */
  onDone: () => void;
  labels: Record<string, string>;
}) {
  const [at, setAt] = useState(-1);
  const [done, setDone] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const t = (k: string) => labels[k] ?? k;

  const steps: Step[] = [
    { label: t('Opening a new tab'), detail: host, ms: 700 },
    { label: t('Connecting your account'), ms: 900 },
    { label: t('Account found'), detail: `UAN ••••${uanTail}`, ms: 800 },
    { label: t('Choosing the right category'), detail: t('Labour & Employment → EPFO'), ms: 900 },
    { label: t('Filling the grievance form'), detail: subject, ms: 1000 },
    { label: t('Submitting'), ms: 800 },
  ];

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const run = () => {
    if (at !== -1) return;
    // Someone who has asked for less motion should still see every step, just
    // without waiting through the theatre.
    const scale = reduced ? 0.15 : 1;
    let elapsed = 0;
    setAt(0);
    steps.forEach((s, i) => {
      elapsed += s.ms * scale;
      timers.current.push(
        setTimeout(() => {
          if (i + 1 < steps.length) setAt(i + 1);
          else {
            setAt(steps.length);
            setDone(true);
            onDone();
          }
        }, elapsed),
      );
    });
  };

  if (at === -1) {
    return (
      <button
        type="button"
        onClick={run}
        className="rounded-sm bg-teal-700 px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-teal-600"
      >
        {t('Simulate sending')}
      </button>
    );
  }

  return (
    <div className="mt-1 overflow-hidden rounded-md border-2 border-ink-200 bg-white">
      {/* the banner never leaves the frame */}
      <p className="flex items-center gap-2 bg-stop px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-white">
        <Icon name="shield" size={13} aria-hidden />
        {t('Simulation. Nothing is sent to any government system.')}
      </p>

      {/* a browser chrome that is obviously a drawing of one */}
      <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50 px-3 py-2">
        <span className="flex gap-1" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
        </span>
        <span className="tabular truncate rounded-xs bg-white px-2.5 py-1 font-mono text-[12px] text-ink-500">
          {host}
        </span>
      </div>

      <ol className="space-y-0 p-4" aria-live="polite">
        {steps.map((s, i) => {
          const state = i < at ? 'done' : i === at ? 'running' : 'todo';
          return (
            <li
              key={s.label}
              className={`flex items-start gap-3 py-2 ${state === 'todo' ? 'opacity-35' : ''}`}
            >
              <span className="mt-0.5 shrink-0" aria-hidden>
                {state === 'done' ? (
                  <svg width="17" height="17" viewBox="0 0 20 20">
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
                ) : state === 'running' ? (
                  <svg width="17" height="17" viewBox="0 0 20 20" className="animate-spin">
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      fill="none"
                      stroke="var(--color-ink-100)"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M10 2a8 8 0 0 1 8 8"
                      fill="none"
                      stroke="var(--color-teal-700)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 20 20">
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      fill="none"
                      stroke="var(--color-ink-200)"
                      strokeWidth="1.6"
                      strokeDasharray="3 2.5"
                    />
                  </svg>
                )}
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-[14.5px] leading-snug ${
                    state === 'todo' ? 'text-ink-500' : 'font-semibold text-ink-900'
                  }`}
                >
                  {s.label}
                </span>
                {s.detail && (
                  <span className="block truncate font-mono text-[12px] text-ink-500">
                    {s.detail}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      {done && (
        <p className="border-t border-ink-100 bg-go-soft px-4 py-3 text-[14.5px] leading-snug text-ink-800">
          <span className="font-bold text-go">{t('Registered in the simulation.')}</span>{' '}
          {t(
            'In reality you would now do exactly these steps yourself on the real portal - which is why the draft above is downloadable and the link beside it opens the genuine site.',
          )}
        </p>
      )}
    </div>
  );
}

/**
 * The handoff plus the form it eventually submits.
 *
 * The sequence has to finish before anything is recorded, so the server action
 * is fired from `onDone` rather than from a click - otherwise the case would
 * jump to "filed" while the simulation was still pretending to type.
 */
export function FileWithHandoff({
  action,
  rung,
  host,
  uanTail,
  subject,
  labels,
}: {
  action: (formData: FormData) => void | Promise<void>;
  rung: string;
  host: string;
  uanTail: string;
  subject: string;
  labels: Record<string, string>;
}) {
  const form = useRef<HTMLFormElement>(null);

  return (
    <form action={action} ref={form}>
      <input type="hidden" name="rung" value={rung} />
      <CpgramsHandoff
        host={host}
        uanTail={uanTail}
        subject={subject}
        labels={labels}
        onDone={() => form.current?.requestSubmit()}
      />
    </form>
  );
}
