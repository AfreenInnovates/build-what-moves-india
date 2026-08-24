'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Counts a number up when it scrolls into view. Inspired by the reactbits CountUp
 * effect, kept dependency-free so it works under the app's strict CSP. Preserves
 * a prefix/suffix (e.g. "~", " cr", "%") around the animated figure.
 */
export function CountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1100,
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setShown(value);
      return;
    }

    const animate = () => {
      if (done.current) return;
      done.current = true;
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setShown(value * eased);
        if (p < 1) requestAnimationFrame(tick);
        else setShown(value);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && animate(),
      { threshold: 0.15 },
    );
    io.observe(el);

    // A number that never animates must still be correct. If the observer has
    // not fired shortly after mount (offscreen capture, headless render, an
    // odd viewport), show the real figure rather than a stuck zero.
    const safety = setTimeout(() => {
      if (!done.current) {
        done.current = true;
        setShown(value);
      }
    }, 1200);

    return () => {
      io.disconnect();
      clearTimeout(safety);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}
