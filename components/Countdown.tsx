'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animates from `from` (the previous reading, straight out of the events table)
 * to `days`. Because the starting point is persisted rather than held in React
 * state, the drop still plays after a full page navigation - and it never
 * replays on a plain refresh, because by then the two values are equal.
 */
export function Countdown({
  days,
  from,
  blocking,
  total,
  labels,
}: {
  days: number;
  from: number | null;
  blocking: number;
  total: number;
  /**
   * Already translated on the server. A translator function cannot cross into a
   * client component - only serialisable props do - so the words come over as
   * plain strings rather than something to call.
   */
  labels?: Record<string, string>;
}) {
  const [shown, setShown] = useState(from ?? days);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = from ?? days;
    const delta = days - start;
    if (delta === 0) {
      setShown(days);
      return;
    }

    const duration = Math.min(1100, 300 + Math.abs(delta) * 60);
    const t0 = performance.now();

    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(start + delta * eased));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [days, from]);

  const done = blocking === 0;
  const tr = (k: string) => labels?.[k] ?? k;

  return (
    <div className="px-5 pt-7 pb-6">
      <p className="text-[13px] uppercase tracking-[0.14em] text-ink-500">
        {done ? tr('Your money arrives in') : tr('Your money is blocked for')}
      </p>

      <div className="mt-1 flex items-baseline gap-2.5">
        <span
          data-testid="countdown"
          className="tabular text-[68px] leading-[0.95] font-semibold tracking-tight text-signal"
        >
          {shown}
        </span>
        <span className="text-[20px] font-medium text-ink-700">{tr('working days')}</span>
      </div>

      <p className="mt-3 text-[15px] text-ink-700">
        {done ? (
          <>{tr('Nothing is blocking you. This is what a clean claim looks like.')}</>
        ) : (
          <>
            <span className="font-semibold text-ink-900">{blocking}</span>{' '}
            {tr('of')} {total} {tr('steps are blocking. Not all of them cost you time.')}
          </>
        )}
      </p>
    </div>
  );
}
