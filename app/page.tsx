import Link from 'next/link';
import { PROCESSES, EXTRA_PROCESSES } from '@/lib/processes';
import { SPEC } from '@/lib/gates/spec';
import { Hl } from '@/components/Chrome';

const HOSTS = [
  ['epfindia.gov.in', 'Notices and circulars. Nothing actually happens here.', 'down'],
  ['unifiedportal-mem.epfindia.gov.in', 'The member portal. The real one.', 'up'],
  ['…/memberInterfacePohw', 'A second portal, just for pension on higher wages.', 'up'],
  ['passbook.epfindia.gov.in', 'Passbook and claim status. Separate login.', 'up'],
  ['unifiedportal-emp.epfindia.gov.in', 'The employer portal. You can never see it.', 'hidden'],
  ['epfigms.gov.in', 'Grievances, and the escalation ladder.', 'up'],
  ['UMANG app', 'UAN activation. Mobile only since 2026.', 'app'],
] as const;

const TODAY = [
  'You search for how to withdraw your EPF and land on the informational site, which is not where anything happens — and is currently down.',
  'You find the member portal and are met with seven competing entry points and a security popup, before you have even logged in.',
  'You log in and see four menus organised by kind of data: View, Manage, Account, Online Services.',
  'You go to Online Services to file your claim. The page will not open, because you have no e-nomination — which lives under a different menu.',
  'You file the nomination, come back, and file the claim. It is accepted for processing.',
  'Ten to twenty working days later it is rejected, with a terse English string. Your name did not match Aadhaar.',
  'You fix the name. It goes to your employer for approval and takes another week or two.',
  'You refile. The clock starts over at zero. Then the exit date turns out to be missing too.',
];

const HERE = [
  'You open one page and tap your name. No password wall, no captcha.',
  'Every one of the seven conditions is checked at once, before you file anything.',
  'You get a number: working days until the money lands, computed along the critical path.',
  'Each blocking gate says what it locks, who has to act — you, your employer, or EPFO — and how long that takes.',
  'The slowest thing you can start today is named, so you begin with the item that actually moves the date.',
  'Fixing something that will not move the date says so, out loud, instead of letting you waste a day.',
  'Each gate has a page showing what EPFO makes you do, why it fails, and what happens here instead.',
  'Your case lives at a plain link. Bookmark it, send it, come back next week — nothing is lost.',
];

const journey = [
  ...Object.values(PROCESSES).map((p) => ({
    name: p.name,
    epfoPath: p.epfoPath,
    epfoHost: p.epfoHost,
    breaks: p.breaks,
    fix: p.fix,
    warning: 'warning' in p ? p.warning : undefined,
  })),
  ...EXTRA_PROCESSES.map((p) => ({
    name: p.name,
    epfoPath: p.epfoPath,
    epfoHost: p.epfoHost,
    breaks: p.breaks,
    fix: p.fix,
    warning: undefined,
  })),
];

export default function Home() {
  return (
    <main className="w-full">
      {/* ---------------------------------------------------------------- hero */}
      <section className="border-b border-ink-100 bg-white">
        <div className="mx-auto grid w-full max-w-[1120px] gap-10 px-5 py-16 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:py-24">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-teal-600">
              EPF withdrawal, unblocked
            </p>
            <h1 className="mt-3 text-[34px] leading-[1.1] font-bold tracking-tight text-ink-900 sm:text-[44px]">
              Find out what is holding your money{' '}
              <span className="text-teal-700">before you file</span>, not after you are rejected.
            </h1>
            <p className="mt-5 max-w-[54ch] text-[17px] leading-relaxed text-ink-700">
              EPFO settled over five crore claims last year and rejected roughly{' '}
              <Hl tone="stop">one in five</Hl>. The dominant cause is not fraud or ineligibility. It
              is that your name is spelled differently in{' '}
              <Hl>two databases that were never built to match</Hl>.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-sm bg-teal-700 px-6 py-3.5 text-[15px] font-medium text-white transition hover:bg-teal-600"
              >
                Open a demo account
              </Link>
              <a
                href="#journey"
                className="rounded-sm border border-ink-100 bg-white px-6 py-3.5 text-[15px] font-medium text-ink-700 transition hover:border-ink-300"
              >
                See it step by step
              </a>
            </div>
          </div>

          {/* the two numbers, side by side */}
          <div className="rounded-md border border-ink-100 bg-ink-50 p-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              The same person, same records
            </p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-sm bg-white p-4">
                <p className="tabular text-[40px] leading-none font-semibold text-signal">27</p>
                <p className="mt-1.5 text-[13px] leading-snug text-ink-700">
                  working days, four gates blocking, discovered one rejection at a time
                </p>
              </div>
              <div className="rounded-sm bg-white p-4">
                <p className="tabular text-[40px] leading-none font-semibold text-go">
                  {SPEC.baselineSettlementDays}
                </p>
                <p className="mt-1.5 text-[13px] leading-snug text-ink-700">
                  working days once everything is cleared, in the right order
                </p>
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-500">
              Both numbers come out of the same rule engine. Neither is written into the page.
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- stats */}
      <section className="border-b border-ink-100 bg-teal-700">
        <div className="mx-auto grid w-full max-w-[1120px] grid-cols-2 gap-6 px-5 py-8 lg:grid-cols-4">
          {[
            ['5 crore+', 'claims settled in FY 2024-25'],
            ['~1 in 5', 'rejected, most on a data mismatch'],
            ['6 hosts', 'plus an app and a portal you cannot see'],
            ['7 gates', 'none of which are shown together'],
          ].map(([n, label]) => (
            <div key={label}>
              <p className="tabular text-[26px] font-semibold leading-none text-white">{n}</p>
              <p className="mt-1.5 text-[13px] leading-snug text-teal-100">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- today vs here */}
      <section className="mx-auto w-full max-w-[1120px] px-5 py-16">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-teal-600">
          Open the website. Here is what happens.
        </p>
        <h2 className="mt-2 max-w-[22ch] text-[27px] leading-tight font-bold tracking-tight text-ink-900">
          The same goal, walked two different ways
        </h2>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-md border border-stop/20 bg-stop-soft/40 p-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-stop">
              On EPFO today
            </p>
            <ol className="mt-4 space-y-3.5">
              {TODAY.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="tabular mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-semibold text-stop">
                    {i + 1}
                  </span>
                  <p className="text-[14.5px] leading-relaxed text-ink-700">{s}</p>
                </li>
              ))}
            </ol>
            <p className="mt-5 border-t border-stop/15 pt-4 text-[14px] font-medium text-stop">
              Four problems found one at a time is roughly six months.
            </p>
          </div>

          <div className="rounded-md border border-teal-200 bg-teal-50 p-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-teal-600">
              Here
            </p>
            <ol className="mt-4 space-y-3.5">
              {HERE.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="tabular mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-[12px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <p className="text-[14.5px] leading-relaxed text-teal-900">{s}</p>
                </li>
              ))}
            </ol>
            <p className="mt-5 border-t border-teal-200 pt-4 text-[14px] font-medium text-teal-700">
              The same four, seen at once and started in the right order, is about four weeks.
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- hosts */}
      <section className="border-y border-ink-100 bg-white">
        <div className="mx-auto w-full max-w-[1120px] px-5 py-16">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-teal-600">
            The surface area
          </p>
          <h2 className="mt-2 text-[27px] leading-tight font-bold tracking-tight text-ink-900">
            One goal, six hosts, seven silent gates
          </h2>
          <p className="mt-3 max-w-[70ch] text-[15.5px] leading-relaxed text-ink-700">
            The menus are organised by <Hl>what kind of data</Hl> something is. Not one of them is
            organised by <Hl tone="signal">who has to act</Hl>. So the fact that filing a claim
            requires an e-nomination filed under a different menu has nowhere to be expressed — and
            you discover it at the moment it stops you.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {HOSTS.map(([host, what, state]) => (
              <div key={host} className="rounded-sm border border-ink-100 bg-ink-50 px-4 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="break-all font-mono text-[12.5px] text-ink-900">{host}</span>
                  {state === 'down' && (
                    <span className="shrink-0 rounded bg-stop-soft px-1.5 py-0.5 text-[10.5px] font-semibold text-stop">
                      DOWN
                    </span>
                  )}
                  {state === 'hidden' && (
                    <span className="shrink-0 rounded bg-wait-soft px-1.5 py-0.5 text-[10.5px] font-semibold text-wait">
                      HIDDEN
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[13px] leading-snug text-ink-500">{what}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- hdiv */}
      <section className="mx-auto w-full max-w-[1120px] px-5 py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-teal-600">
              The structural problem
            </p>
            <h2 className="mt-2 text-[27px] leading-tight font-bold tracking-tight text-ink-900">
              Nothing inside EPFO can be linked to
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-ink-700">
              Every URL on the member portal carries a <Hl>one-time session token</Hl>. Copy a link
              and open it later and you get an error page. Load the same page twice and the token is
              different.
            </p>
            <p className="mt-3 text-[15.5px] leading-relaxed text-ink-700">
              This is why every guide says &ldquo;click here, then here, then here&rdquo; instead of
              giving you a link. Why nobody can send a colleague the page that fixes their KYC. And
              why a session timeout does not lose your place — <Hl tone="stop">it loses everything</Hl>.
            </p>
            <p className="mt-3 text-[15.5px] leading-relaxed text-ink-700">
              Your case here lives at a plain address. That is not a convenience feature; it is the
              one thing the incumbent structurally cannot do.
            </p>
          </div>
          <pre className="overflow-x-auto rounded-md bg-ink-900 px-5 py-5 font-mono text-[11.5px] leading-relaxed text-ink-100">
{`$ curl -sI "…/uanservice/v2/home?_HDIV_STATE_=17-8-8F4BCB3F…"
302  ->  error.jsp          # token from another session

$ curl -sI "…/uanservice/v2/home"
302  ->  error.jsp          # no token at all

$ curl -s "…/memberinterface/" | grep -o '_HDIV_STATE_=[^"]*'
_HDIV_STATE_=3-0-ACF581AB   # first load
_HDIV_STATE_=4-0-5F2395D8   # second load, seconds later`}
          </pre>
        </div>
      </section>

      {/* ------------------------------------------------------------ journey */}
      <section id="journey" className="border-t border-ink-100 bg-white">
        <div className="mx-auto w-full max-w-[1120px] px-5 py-16">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-teal-600">
            Process by process
          </p>
          <h2 className="mt-2 text-[27px] leading-tight font-bold tracking-tight text-ink-900">
            What each step costs you today
          </h2>
          <p className="mt-3 max-w-[70ch] text-[15.5px] leading-relaxed text-ink-700">
            In the order you actually meet them, from opening the site to escalating a claim that
            went nowhere.
          </p>

          <div className="mt-10 space-y-5">
            {journey.map((p, i) => (
              <article
                key={p.name}
                className="grid gap-5 rounded-md border border-ink-100 p-5 lg:grid-cols-[220px_1fr] lg:p-6"
              >
                <div>
                  <p className="tabular text-[13px] font-semibold text-teal-600">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-1 text-[18px] leading-tight font-semibold text-ink-900">
                    {p.name}
                  </h3>
                  <p className="mt-2 break-words font-mono text-[11.5px] leading-relaxed text-ink-500">
                    {p.epfoPath}
                  </p>
                  <p className="mt-1 break-all font-mono text-[11px] text-ink-300">{p.epfoHost}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-sm bg-stop-soft/50 p-4">
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-stop">
                      What breaks
                    </p>
                    <p className="mt-2 text-[14px] leading-relaxed text-ink-700">{p.breaks}</p>
                  </div>
                  <div className="rounded-sm bg-teal-50 p-4">
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-teal-600">
                      What we do differently
                    </p>
                    <p className="mt-2 text-[14px] leading-relaxed text-teal-900">{p.fix}</p>
                  </div>
                  {p.warning && (
                    <div className="rounded-sm border border-signal/25 bg-signal-soft p-4 md:col-span-2">
                      <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-signal">
                        The thing nobody tells you
                      </p>
                      <p className="mt-2 text-[14px] leading-relaxed text-ink-900">{p.warning}</p>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- cta */}
      <section className="mx-auto w-full max-w-[1120px] px-5 py-16">
        <div className="rounded-md bg-teal-700 px-6 py-12 text-center">
          <h2 className="text-[26px] leading-tight font-bold tracking-tight text-white">
            See it on a real case
          </h2>
          <p className="mx-auto mt-3 max-w-[46ch] text-[15.5px] leading-relaxed text-teal-100">
            Ravi has four gates blocking and a claim that came back rejected. Priya has none. Both
            take one tap, and no password.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-block rounded-sm bg-white px-7 py-3.5 text-[15px] font-medium text-teal-900 transition hover:bg-teal-50"
          >
            Open a demo account
          </Link>
        </div>
      </section>
    </main>
  );
}
