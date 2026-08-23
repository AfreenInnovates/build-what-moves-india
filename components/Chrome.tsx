import Link from 'next/link';
import { cookies } from 'next/headers';
import { signOut } from '@/app/actions';

/** Highlighted phrase. Used sparingly — if everything is highlighted, nothing is. */
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
  const signedIn = Boolean((await cookies()).get('case_id')?.value);

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 py-3">
        <Link href="/" className="-my-1 flex min-h-[44px] items-center gap-2.5 py-1">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
            <circle cx="10" cy="10" r="7" fill="none" stroke="var(--color-teal-700)" strokeWidth="2" />
            <path d="M10 3a7 7 0 0 1 0 14z" fill="var(--color-teal-700)" />
          </svg>
          <span className="text-[15px] font-bold tracking-tight text-ink-900">Seven Gates</span>
        </Link>

        <nav className="flex items-center gap-1.5">
          {signedIn ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-sm px-3 py-1.5 text-[13.5px] font-medium text-ink-700 transition hover:bg-ink-50"
              >
                My claim
              </Link>
              <Link
                href="/login"
                className="rounded-sm px-3 py-1.5 text-[13.5px] text-ink-700 transition hover:bg-ink-50"
              >
                Other cases
              </Link>
              <form action={signOut}>
                <button className="rounded-sm px-3 py-1.5 text-[13.5px] text-ink-500 transition hover:bg-ink-50">
                  Leave
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/whats-mocked"
                className="rounded-sm px-3 py-1.5 text-[13.5px] text-ink-700 transition hover:bg-ink-50"
              >
                What&rsquo;s mocked
              </Link>
              <Link
                href="/login"
                className="rounded-sm bg-teal-700 px-3.5 py-1.5 text-[13.5px] font-bold text-white transition hover:bg-teal-600"
              >
                Open a demo
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-ink-100 bg-white">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-8">
        <p className="text-[13px] leading-relaxed text-ink-500">
          An independent tool, not affiliated with or endorsed by EPFO or the Government of India. No
          real Aadhaar, PAN or bank data is used anywhere in this project.{' '}
          <Link href="/whats-mocked" className="inline-flex min-h-[24px] items-center underline hover:text-teal-600">
            See exactly what is mocked
          </Link>
          .
        </p>
        <p className="mt-3 text-[12.5px] text-ink-300">
          Balance by SMS with no internet at all: give a missed call to 9966044425. EPFO helpline
          14470, multilingual, 7am to 9pm.
        </p>
      </div>
    </footer>
  );
}
