'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tag } from './ui';
import { Icon } from './Icon';
import { inr } from '@/lib/insights';

export interface PickerCard {
  id: string;
  slug: string;
  name: string;
  headline: string | null;
  uan: string;
  days: number;
  blocking: number;
  balance: number;
  scenario: { label: string; tone: 'error' | 'success' | 'warning' };
}

/**
 * Clicking a card takes you to that person's sign-in screen, not straight to the
 * dashboard, so judges can see the login flow. The grid locks on the first click
 * so a second card cannot queue behind it.
 */
export function CasePicker({ cards }: { cards: PickerCard[] }) {
  const router = useRouter();
  const [openingSlug, setOpeningSlug] = useState<string | null>(null);
  const busy = openingSlug !== null;

  const open = (slug: string) => {
    if (busy) return;
    setOpeningSlug(slug);
    router.push(`/login/${slug}`);
  };

  return (
    <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-busy={busy}>
      {cards.map((c) => {
        const opening = openingSlug === c.slug;
        return (
          <button
            key={c.id}
            onClick={() => open(c.slug)}
            disabled={busy}
            className={`card-hover group relative flex h-full w-full flex-col rounded-xl border border-ink-100 bg-white p-5 text-left ${
              busy && !opening ? 'pointer-events-none opacity-45' : ''
            } ${opening ? 'ring-2 ring-teal-700' : 'hover:border-teal-700'} disabled:cursor-default`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[17.5px] font-bold text-ink-900">{c.name}</p>
                <div className="mt-1">
                  <Tag tone={c.scenario.tone}>{c.scenario.label}</Tag>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className={`tabular text-[32px] font-bold leading-none ${c.blocking === 0 ? 'text-go' : 'text-signal'}`}>
                  {c.days}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">days</p>
              </div>
            </div>

            <p className="mt-3.5 flex-1 text-[14px] leading-relaxed text-ink-700">{c.headline}</p>

            <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3.5 text-[12.5px] text-ink-400">
              <span className="tabular">UAN {c.uan}</span>
              <span className="inline-flex items-center gap-1 font-semibold text-teal-700 opacity-0 transition group-hover:opacity-100">
                Sign in <Icon name="route" size={13} aria-hidden />
              </span>
            </div>

            {opening && (
              <span className="absolute inset-0 flex items-center justify-center gap-2.5 rounded-xl bg-white/90 text-[15px] font-bold text-teal-700">
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 20 20" aria-hidden>
                  <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="38" strokeDashoffset="12" strokeLinecap="round" />
                </svg>
                Opening…
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
