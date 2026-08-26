'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

/** Long enough to actually read the two lines, short enough not to feel stuck. */
const HOLD_MS = 2200;

/**
 * Going back to the case list is a sign-out, and it should say so.
 *
 * On a real deployment the session would simply persist and this screen would
 * never appear. The demo cannot do that, because six cases have to be reachable
 * one after another. Rather than dropping people on the login page with no
 * explanation, the transition is held briefly and used to say what happened.
 *
 * The overlay is portalled to the body because this button also sits in the site
 * header, which has a backdrop-filter - that makes the header the containing
 * block for any fixed-position child, which would clip the overlay to the header.
 */
export function BackToCases({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const go = () => {
    if (leaving) return;
    setLeaving(true);
    router.prefetch('/login');
    timer.current = setTimeout(() => router.push('/login'), HOLD_MS);
  };

  return (
    <>
      <button onClick={go} disabled={leaving} className={className}>
        {children}
      </button>

      {leaving &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/90 px-6 backdrop-blur-sm">
            <div className="max-w-[380px] text-center">
              <svg
                className="mx-auto animate-spin text-teal-700"
                width="30"
                height="30"
                viewBox="0 0 20 20"
                aria-hidden
              >
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
              <p className="mt-4 text-[18px] font-bold text-ink-900">Signing you out</p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-700">
                Normally you would stay signed in for days. This demo signs you out so the next
                person starts clean.
              </p>
              <p className="mt-2 text-[14px] text-ink-500">Your progress stays saved.</p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
