'use client';

import { useFormStatus } from 'react-dom';
import { Tag } from './ui';

/**
 * The card and its pending state.
 *
 * Without this, opening a case looked like nothing happened for a second or two
 * while the dashboard rendered — so people clicked again, and the second click
 * hit the still-mounted form and fired a second sign-in. Disabling on submit and
 * saying "Opening…" removes both the confusion and the duplicate request.
 */
export function CaseCard({
  name,
  headline,
  uan,
  password,
  days,
  blocking,
  scenario,
}: {
  name: string;
  headline: string | null;
  uan: string;
  password: string;
  days: number;
  blocking: number;
  scenario: { label: string; tone: 'error' | 'success' | 'warning' };
}) {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="relative flex h-full w-full flex-col rounded-md border-2 border-ink-100 bg-white p-5 text-left transition hover:border-teal-700 hover:shadow-[0_2px_12px_rgba(5,81,96,0.09)] disabled:cursor-wait"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[17px] font-bold text-ink-900">{name}</p>
          <Tag tone={scenario.tone}>{scenario.label}</Tag>
        </div>
        <div className="shrink-0 text-right">
          <p
            className={`tabular text-[30px] font-bold leading-none ${
              blocking === 0 ? 'text-go' : 'text-signal'
            }`}
          >
            {days}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">days</p>
        </div>
      </div>

      <p className="mt-3 flex-1 text-[14px] leading-relaxed text-ink-700">{headline}</p>

      <p className="mt-4 border-t border-ink-100 pt-3 text-[12.5px] text-ink-400">
        <span className="tabular">UAN {uan}</span> · {password} ·{' '}
        {blocking === 0 ? 'nothing blocking' : `${blocking} gates blocking`}
      </p>

      {pending && (
        <span className="absolute inset-0 flex items-center justify-center gap-2.5 rounded-md bg-white/92 text-[15px] font-bold text-teal-700">
          <svg className="animate-spin" width="18" height="18" viewBox="0 0 20 20" aria-hidden>
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="38"
              strokeDashoffset="12"
              strokeLinecap="round"
            />
          </svg>
          Opening {name.split(' ')[0]}&rsquo;s case…
        </span>
      )}
    </button>
  );
}
