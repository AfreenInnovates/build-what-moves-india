'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useFormStatus } from 'react-dom';
import { signOut } from '@/app/actions';
import { Icon } from './Icon';

function Confirm({ first }: { first: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="card-hover flex items-center justify-center gap-2 rounded-md bg-teal-700 px-6 py-2.5 text-[14.5px] font-bold text-white hover:bg-teal-600 disabled:opacity-70"
    >
      {pending ? 'Leaving…' : `Leave ${first}'s case`}
      {!pending && <Icon name="route" size={16} aria-hidden />}
    </button>
  );
}

/**
 * Leaving is explained rather than silent. On a real deployment you would stay
 * signed in until your session token expired; this demo deliberately does not
 * keep you logged in, because six cases have to be reachable one after another.
 */
export function LeaveCase({ name }: { name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const first = name.split(' ')[0];

  // "Leave" means leave THIS person's case. On the home page or the case list
  // you are not inside one, so the button has nothing to leave and only invites
  // the question of what it would do.
  if (!pathname.startsWith('/dashboard')) return null;

  // Portalled to the body on purpose. This button lives inside the site header,
  // and the header carries backdrop-blur - an element with a backdrop-filter
  // becomes the containing block for its fixed-position descendants, so
  // "fixed inset-0" was resolving to the 72px header instead of the viewport and
  // the dialog was being clipped to a sliver at the top of the screen.

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="whitespace-nowrap rounded-sm px-2.5 py-2 text-[14px] text-ink-500 transition hover:bg-ink-50 sm:px-3.5 sm:text-[15px]"
      >
        Leave
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ink-900/25 px-5 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          {/*
            A short window - a laptop with the browser half-height, or a phone in
            landscape - used to cut the top of this dialog off with no way to
            scroll to it. Centring happens through auto margins inside a
            scrollable layer instead of a flex centre, so the dialog can always be
            reached however little vertical room there is.
          */}
          <div className="mx-auto my-auto flex min-h-full max-w-[520px] items-center">
            <div className="w-full rounded-lg border border-ink-100 bg-white p-7 shadow-[0_20px_60px_rgba(5,81,96,0.22)]">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Icon name="key" size={22} aria-hidden />
              </span>
              <div>
                <h2 className="text-[20px] font-bold tracking-tight text-ink-900">
                  Leaving {name}
                </h2>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-700">
                  Normally you would stay signed in until your session token expired, with no
                  repeated logins. This demo does not keep you signed in, because all six cases have
                  to be reachable one after another.
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
                  {first}&rsquo;s progress stays saved in the database. You can sign back in any
                  time and pick up exactly where this left off.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-4 py-2.5 text-[14px] font-semibold text-ink-500 hover:text-ink-800"
              >
                Stay here
              </button>
              <form action={signOut}>
                <Confirm first={first} />
              </form>
              </div>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
