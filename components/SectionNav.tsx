'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { SECTIONS } from '@/lib/sections';
import { Icon } from './Icon';

/**
 * A click needs to say "heard you" the instant it lands, or a navigation that
 * takes a beat — a dev-mode route compile, a slow connection — reads as a dead
 * button. useLinkStatus reports the pending state of its enclosing Link, so the
 * row you tapped shows a spinner immediately, before the new page is anywhere
 * near ready.
 */
function Pending({ active }: { active: boolean }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <svg
      className="animate-spin"
      width="15"
      height="15"
      viewBox="0 0 20 20"
      aria-hidden
      style={{ color: active ? '#fff' : 'var(--color-teal-700)' }}
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
  );
}

export function SectionNav({ alertCount }: { alertCount: number }) {
  const path = usePathname();

  return (
    <nav className="space-y-0.5">
      {SECTIONS.map((s) => {
        const active = s.href === '/dashboard' ? path === '/dashboard' : path.startsWith(s.href);
        return (
          <Link
            key={s.href}
            href={s.href}
            prefetch
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[14px] transition ${
              active ? 'bg-teal-700 font-semibold text-white' : 'text-ink-700 hover:bg-ink-50'
            }`}
          >
            <Icon name={s.icon} size={18} aria-hidden className="shrink-0" />
            <span className="flex-1">{s.label}</span>
            <Pending active={active} />
            {s.href === '/dashboard/alerts' && alertCount > 0 && (
              <span
                className={`tabular rounded-full px-1.5 text-[11px] font-bold ${
                  active ? 'bg-white/25 text-white' : 'bg-signal text-white'
                }`}
              >
                {alertCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
