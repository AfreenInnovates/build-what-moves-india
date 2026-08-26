'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LANGS, type Lang } from '@/lib/i18n/langs';
import { Icon } from './Icon';

/**
 * Switching language re-renders on the server, because that is where the copy
 * lives. The cookie is set first, then the router is refreshed - so the choice
 * survives navigation and a reload rather than living in component state.
 */
export function LanguageSwitcher({ current }: { current: Lang }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const pick = async (lang: Lang) => {
    setOpen(false);
    if (lang === current) return;
    await fetch('/api/lang', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang }),
    });
    startTransition(() => router.refresh());
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Language"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-sm px-2 py-2 text-[15px] text-ink-700 transition hover:bg-ink-50 disabled:opacity-60 sm:gap-1.5 sm:px-3"
        disabled={pending}
      >
        <Icon name="explain" size={16} aria-hidden />
        <span className="hidden sm:inline">{LANGS[current].native}</span>
        <Icon name={open ? 'up' : 'down'} size={14} aria-hidden />
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
            role="listbox"
            className="absolute right-0 z-50 mt-1 w-[190px] overflow-hidden rounded-md border border-ink-100 bg-white py-1 shadow-[0_10px_30px_rgba(5,81,96,0.16)]"
          >
            {(Object.keys(LANGS) as Lang[]).map((l) => (
              <li key={l}>
                <button
                  role="option"
                  aria-selected={l === current}
                  onClick={() => pick(l)}
                  className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[15px] transition hover:bg-ink-50 ${
                    l === current ? 'font-bold text-teal-700' : 'text-ink-700'
                  }`}
                >
                  <span>{LANGS[l].native}</span>
                  {l === current && <Icon name="check" size={15} aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
