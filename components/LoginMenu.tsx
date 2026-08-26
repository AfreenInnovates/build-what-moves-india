'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, type IconName } from './Icon';

/**
 * One way in, with the two sides named.
 *
 * The header used to offer "Open a demo", which said nothing about what you were
 * about to see, and once you were inside a case it said "View open cases" - two
 * different labels for what is really the same door. This is a login control
 * that asks the only question that matters first: whose side of the problem are
 * you here for.
 */
export function LoginMenu({ labels }: { labels: Record<string, string> }) {
  const t = (k: string) => labels[k] ?? k;
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const OPTIONS: { href: string; label: string; sub: string; icon: IconName }[] = [
    {
      href: '/login',
      label: 'Employee',
      sub: 'Get your own PF money out',
      icon: 'records',
    },
    {
      href: '/login?as=employer',
      label: 'Employer',
      sub: 'Act on requests from former staff',
      icon: 'employer',
    },
  ];

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-sm bg-teal-700 px-3 py-2 text-[14px] font-bold text-white transition hover:bg-teal-600 sm:px-4 sm:text-[15px]"
      >
        {t('Log in')}
        <Icon name={open ? 'up' : 'down'} size={15} aria-hidden />
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
          />
          <ul
            role="menu"
            className="absolute right-0 z-50 mt-1.5 w-[290px] overflow-hidden rounded-lg border border-ink-100 bg-white py-1 shadow-[0_12px_34px_rgba(5,81,96,0.18)]"
          >
            {OPTIONS.map((o) => (
              <li key={o.href}>
                <button
                  role="menuitem"
                  onClick={() => go(o.href)}
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-ink-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <Icon name={o.icon} size={18} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14.5px] font-bold text-ink-900">{t(o.label)}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-600">
                      {t(o.sub)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
