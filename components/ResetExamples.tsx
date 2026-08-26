'use client';

import { useFormStatus } from 'react-dom';
import { resetAllExamples } from '@/app/actions';
import { Icon } from './Icon';

function Button() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      title="Progress is saved in the database. Resetting puts every profile back to the state it started in."
      className="flex shrink-0 items-center gap-2 rounded-md border-2 border-ink-100 bg-white px-4 py-2.5 text-[13.5px] font-bold text-ink-700 transition hover:border-signal hover:text-signal disabled:opacity-60"
    >
      {pending ? (
        <>
          <svg className="animate-spin" width="15" height="15" viewBox="0 0 20 20" aria-hidden>
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="38" strokeDashoffset="12" strokeLinecap="round" />
          </svg>
          Resetting…
        </>
      ) : (
        <>
          <Icon name="route" size={15} aria-hidden />
          Reset all examples
        </>
      )}
    </button>
  );
}

/**
 * Housekeeping for whoever is demonstrating the product. Everything a visitor
 * does is written to the database and stays there, so without this the second
 * person to look at a case sees whatever the first person left behind.
 */
export function ResetExamples({ justReset }: { justReset?: boolean }) {
  return (
    <div className="mt-8 flex flex-col gap-3 rounded-lg border border-ink-100 bg-white px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex-1">
        <p className="text-[14px] font-bold text-ink-900">
          {justReset ? 'Every profile is back to its starting state.' : 'Progress here is real and saved'}
        </p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">
          Anything you mark as done is written to the database and stays there, so these cases keep
          whatever the last visitor left behind. Reset puts all six back to the state they started
          in, and that reset is saved too.
        </p>
      </div>
      <form action={resetAllExamples}>
        <Button />
      </form>
    </div>
  );
}
