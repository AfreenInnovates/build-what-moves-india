'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from './Icon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { BackToCases } from './BackToCases';
import { LeaveCase } from './LeaveCase';
import type { Lang } from '@/lib/i18n/langs';

export function MobileNav({ current, signedIn, caseName, labels }: { current: Lang; signedIn: boolean; caseName?: string; labels: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const t = (key: string) => labels[key] ?? key;
  const close = () => setOpen(false);
  const item = 'flex min-h-[44px] items-center gap-3 rounded-md px-3 text-[15px] font-semibold text-ink-800 transition hover:bg-teal-50 hover:text-teal-700';

  return (
    <div className="relative lg:hidden">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? t('Close menu') : t('Open menu')} aria-expanded={open} aria-controls="mobile-navigation" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm text-ink-700 transition hover:bg-teal-50 hover:text-teal-700">
        <Icon name={open ? 'close' : 'menu'} size={23} aria-hidden />
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" aria-label={t('Close menu')} onClick={close} />
          <div id="mobile-navigation" className="absolute right-0 top-full z-50 mt-2 w-[min(21rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-ink-100 bg-white p-2 shadow-[0_14px_36px_rgba(5,81,96,0.18)]">
            <div className="flex items-center justify-between border-b border-ink-100 px-2 pb-2"><span className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink-500">{t('Explore')}</span><LanguageSwitcher current={current} /></div>
            <nav className="mt-1 grid" aria-label="Mobile navigation">
              <Link onClick={close} href="/whats-mocked" className={item}><Icon name="eye" size={18} aria-hidden /> {t("What's real and what's mocked")}</Link>
              <Link onClick={close} href="/technology" className={item}><Icon name="gates" size={18} aria-hidden /> {t('Technology')}</Link>
              <Link onClick={close} href="/compare" className={item}><Icon name="search" size={18} aria-hidden /> {t('EPFO vs us')}</Link>
              {signedIn ? <><BackToCases className={item}><Icon name="route" size={18} aria-hidden /> {t('View open cases')}</BackToCases>{caseName && <LeaveCase name={caseName} />}</> : <Link onClick={close} href="/login" className="mt-1 flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-teal-700 px-3 text-[15px] font-bold text-white transition hover:bg-teal-600"><Icon name="key" size={18} aria-hidden /> {t('Log in')}</Link>}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
