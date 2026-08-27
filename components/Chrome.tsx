import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { loadCase } from '@/lib/case';
import { LeaveCase } from './LeaveCase';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LoginMenu } from './LoginMenu';
import { getLang, translator } from '@/lib/i18n';
import { BackToCases } from './BackToCases';
import { MobileNav } from './MobileNav';

/** Highlighted phrase. Used sparingly - if everything is highlighted, nothing is. */
export function Hl({
  children,
  tone = 'teal',
}: {
  children: React.ReactNode;
  tone?: 'teal' | 'signal' | 'stop';
}) {
  const tones = {
    teal: 'bg-teal-100 text-teal-900',
    signal: 'bg-signal-soft text-signal',
    stop: 'bg-stop-soft text-stop',
  } as const;
  return <span className={`rounded px-1 py-0.5 font-medium ${tones[tone]}`}>{children}</span>;
}

export async function SiteHeader() {
  // Inside a case the header should be about the case, not about the pitch.
  const caseId = (await cookies()).get('case_id')?.value;
  // loadCase is deduped per render, so on dashboard pages this costs no extra query
  const c = caseId ? await loadCase(caseId).catch(() => null) : null;
  const signedIn = Boolean(c);
  const lang = await getLang();
  const t = translator(lang);

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-2 px-3 py-4 sm:px-5">
        <Link href="/" className="-my-1 flex min-h-[44px] shrink-0 items-center gap-2 py-1 sm:gap-2.5">
          <Image src="/seven-gates-logo.png" width={28} height={28} alt="" aria-hidden="true" priority />
          <span className="hidden text-[17px] font-bold tracking-tight text-ink-900 sm:inline">
            {t('Seven Gates')}
          </span>
        </Link>

        <nav className="flex min-w-0 cursor-pointer items-center gap-1 sm:gap-1.5">
          <div className="hidden lg:block"><LanguageSwitcher current={lang} /></div>
          <Link
            href="/whats-mocked"
            title={t("What's real and what's mocked")}
            className="hidden whitespace-nowrap rounded-sm px-2.5 py-2 text-[14px] text-ink-700 transition hover:bg-teal-50 hover:text-teal-700 lg:inline-flex lg:px-3.5 lg:text-[15px]"
          >
            {t("What's real and what's mocked")}
          </Link>
          <Link
            href="/technology"
            title={t('How Seven Gates is built')}
            className="hidden whitespace-nowrap rounded-sm px-2.5 py-2 text-[14px] text-ink-700 transition hover:bg-teal-50 hover:text-teal-700 lg:inline-flex lg:px-3.5 lg:text-[15px]"
          >
            {t('Technology')}
          </Link>
          {signedIn ? (
            <>
              <BackToCases className="whitespace-nowrap rounded-sm px-2.5 py-2 text-[14px] text-ink-700 transition hover:bg-teal-50 hover:text-teal-700 disabled:opacity-60 sm:px-3.5 sm:text-[15px]">
                <span className="sm:hidden">{t('Cases')}</span>
                <span className="hidden sm:inline">{t('View open cases')}</span>
              </BackToCases>
              <Link
                href="/compare"
                title={t('See what EPFO does today and what we changed, with sources')}
                className="hidden whitespace-nowrap rounded-sm px-2.5 py-2 text-[14px] text-ink-700 transition hover:bg-teal-50 hover:text-teal-700 lg:inline-flex lg:px-3.5 lg:text-[15px]"
              >
                {t('EPFO vs us')}
              </Link>
              <LeaveCase name={c!.member.display_name} />
            </>
          ) : (
            <>
              <Link
                href="/compare"
                title={t('See what EPFO does today and what we changed, with sources')}
                className="hidden rounded-sm px-3.5 py-2 text-[15px] text-ink-700 transition hover:bg-teal-50 hover:text-teal-700 lg:inline-flex"
              >
                {t('EPFO vs us')}
              </Link>
              <LoginMenu
                labels={Object.fromEntries(
                  [
                    'Log in',
                    'Employee',
                    'Get your own PF money out',
                    'Employer',
                    'Act on requests from former staff',
                  ].map((k) => [k, t(k)]),
                )}
              />
            </>
          )}
          <MobileNav
            current={lang}
            signedIn={signedIn}
            caseName={c?.member.display_name}
            labels={Object.fromEntries(
              [
                'Close menu',
                'Open menu',
                'Explore',
                "What's real and what's mocked",
                'Technology',
                'EPFO vs us',
                'View open cases',
                'Log in',
              ].map((k) => [k, t(k)]),
            )}
          />
        </nav>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const t = translator(await getLang());
  return (
    <footer className="mt-20 border-t border-ink-100 bg-white">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-8">
        <p className="text-[13px] leading-relaxed text-ink-500">
          {t(
            'A prototype built for the Build What Moves India hackathon. It is not EPFO, it is not connected to EPFO, and it is not approved by EPFO or the Government of India. Nothing here reaches any real system, and no real Aadhaar, PAN or bank data is used anywhere in it.',
          )}{' '}
          <a
            href="https://buildwhatmovesindia.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[24px] items-center underline hover:text-teal-600"
          >
            {t('About the hackathon')}
          </a>
          .{' '}
          <Link href="/compare" className="inline-flex min-h-[24px] items-center underline hover:text-teal-600">
            {t('What we checked about EPFO')}
          </Link>
          .{' '}
          <Link href="/whats-mocked" className="inline-flex min-h-[24px] items-center underline hover:text-teal-600">
            {t("What's real and what's mocked")}
          </Link>.
        </p>
      </div>
    </footer>
  );
}
