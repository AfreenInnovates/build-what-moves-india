'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';

/** Long enough to actually read the two lines, short enough not to feel stuck. */
const HOLD_MS = 2000;

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
  const pathname = usePathname();

  /**
   * Which page we started leaving from, rather than a plain "leaving" flag.
   *
   * This button lives in the site header, which is not unmounted by a client
   * navigation - so a boolean set on click stayed true after arriving and left
   * the overlay stuck over the next page forever. Comparing against the current
   * path means arriving anywhere else clears it on its own, with no effect and
   * nothing to reset.
   */
  const [from, setFrom] = useState<string | null>(null);

  /**
   * Forget the departure as soon as the route actually changes.
   *
   * Without this, "from" stayed pointing at /dashboard forever: leaving a case
   * hid the overlay on arrival at /login, but signing into the NEXT case
   * returned to /dashboard, the stale value matched again, and the overlay
   * reappeared over a case nobody was leaving. Adjusting state during render on
   * a changed value is React's own pattern for this - it re-renders immediately
   * without committing the first pass, and needs no effect.
   */
  const [seenAt, setSeenAt] = useState(pathname);
  if (seenAt !== pathname) {
    setSeenAt(pathname);
    if (from !== null) setFrom(null);
  }

  const leaving = from !== null && from === pathname;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const go = () => {
    if (leaving) return;

    // Only worth explaining when you are actually inside somebody's case. From
    // the home page or the case list this button is ordinary navigation, and a
    // two second "signing you out" in front of it is just a delay.
    if (!pathname.startsWith('/dashboard')) {
      router.push('/login');
      return;
    }

    setFrom(pathname);
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
