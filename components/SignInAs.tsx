'use client';

import { useState } from 'react';
import { Icon, type IconName } from './Icon';

type Side = 'employee' | 'employer';

/**
 * Which side of the problem are you here to see?
 *
 * A dropdown rather than two panels side by side. Both halves stacked down the
 * page made the employer half look like an afterthought below the fold, and on
 * a phone it was two screens of scrolling before you knew it existed. One
 * control, at the top, says plainly that there are two sides and shows one.
 */
export function SignInAs({
  employee,
  employer,
  initial = 'employee',
  labels,
}: {
  employee: React.ReactNode;
  employer: React.ReactNode;
  /** which side the header's Log in menu asked for */
  initial?: Side;
  labels: Record<string, string>;
}) {
  const t = (k: string) => labels[k] ?? k;
  const [side, setSide] = useState<Side>(initial);
  const [open, setOpen] = useState(false);

  const OPTIONS: { id: Side; label: string; sub: string; icon: IconName }[] = [
    {
      id: 'employee',
      label: 'Employee',
      sub: 'Someone trying to get their own PF money out. Six people, each stuck differently.',
      icon: 'records',
    },
    {
      id: 'employer',
      label: 'Employer',
      sub: 'A company they used to work for. Requests waiting on you to act.',
      icon: 'employer',
    },
  ];

  const current = OPTIONS.find((o) => o.id === side)!;

  return (
    <>
      <div className="mt-8 max-w-[460px]">
        <label className="block text-[13px] font-bold uppercase tracking-[0.08em] text-ink-500">
          {t('Sign in as')}
        </label>

        <div className="relative mt-2">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="flex w-full items-center gap-3 rounded-lg border-2 border-ink-100 bg-white px-4 py-3.5 text-left transition hover:border-teal-700"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Icon name={current.icon} size={20} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15.5px] font-bold text-ink-900">{t(current.label)}</span>
              <span className="mt-0.5 block text-[13.5px] leading-snug text-ink-600">
                {t(current.sub)}
              </span>
            </span>
            <Icon
              name={open ? 'up' : 'down'}
              size={18}
              className="shrink-0 text-ink-500"
              aria-hidden
            />
          </button>

          {open && (
            <>
              {/* a click anywhere else closes it */}
              <button
                className="fixed inset-0 z-40 cursor-default"
                aria-hidden
                tabIndex={-1}
                onClick={() => setOpen(false)}
              />
              <ul
                role="listbox"
                className="absolute inset-x-0 z-50 mt-1.5 overflow-hidden rounded-lg border border-ink-100 bg-white py-1 shadow-[0_12px_34px_rgba(5,81,96,0.18)]"
              >
                {OPTIONS.map((o) => (
                  <li key={o.id}>
                    <button
                      role="option"
                      aria-selected={o.id === side}
                      onClick={() => {
                        setSide(o.id);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-ink-50 ${
                        o.id === side ? 'bg-teal-50/60' : ''
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          o.id === side ? 'bg-teal-700 text-white' : 'bg-ink-50 text-ink-500'
                        }`}
                      >
                        <Icon name={o.icon} size={18} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-[15px] font-bold ${
                            o.id === side ? 'text-teal-900' : 'text-ink-900'
                          }`}
                        >
                          {t(o.label)}
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-snug text-ink-600">
                          {t(o.sub)}
                        </span>
                      </span>
                      {o.id === side && (
                        <Icon name="check" size={17} className="shrink-0 text-teal-700" aria-hidden />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="mt-8">{side === 'employee' ? employee : employer}</div>
    </>
  );
}
