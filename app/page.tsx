import Link from 'next/link';
import { SPEC } from '@/lib/gates/spec';
import { Icon, type IconName } from '@/components/Icon';
import { CountUp } from '@/components/CountUp';

const HOSTS = [
  ['epfindia.gov.in', 'Notices and circulars', 'down'],
  ['unifiedportal-mem', 'The member portal', 'up'],
  ['…/memberInterfacePohw', 'Pension on higher wages', 'up'],
  ['passbook.epfindia', 'Passbook and claim status', 'up'],
  ['unifiedportal-emp', 'Employer portal, unseen', 'hidden'],
  ['epfigms.gov.in', 'Grievances', 'up'],
  ['UMANG app', 'UAN activation', 'app'],
] as const;

const STATS = [
  { value: 32.56, decimals: 2, suffix: ' cr', label: 'members', sub: 'as of 31 Mar 2024' },
  { value: 5.08, decimals: 2, suffix: ' cr', label: 'claims settled', sub: 'FY 2024-25' },
  { value: 26, decimals: 0, prefix: '~', suffix: '%', label: 'claims rejected', sub: 'FY 2023-24' },
  { value: 8.25, decimals: 2, suffix: '%', label: 'annual interest', sub: 'FY 2024-25' },
] as const;

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'preflight',
    title: 'Open your case',
    body: 'Tap a name. No password, no captcha, no typing. Your progress lives at a link you can come back to.',
  },
  {
    icon: 'search',
    title: 'See what is blocking you',
    body: 'All seven conditions checked in one look, before you file. Each shows what it locks and who has to act.',
  },
  {
    icon: 'route',
    title: 'Fix them in the right order',
    body: 'Start with the slowest thing you can act on today. The countdown shrinks as each gate clears.',
  },
];

const DIFF: { icon: IconName; tone: keyof typeof TONE; title: string; body: string }[] = [
  {
    icon: 'gates',
    tone: 'teal',
    title: 'One page, all seven gates',
    body: 'Everything between you and your money on a single screen, in the order that unblocks it.',
  },
  {
    icon: 'clock',
    tone: 'sun',
    title: 'A number, not a status word',
    body: 'Working days until settlement, that shrink as you clear gates. The portal gives you a word and no forecast.',
  },
  {
    icon: 'people',
    tone: 'sky',
    title: 'Says who has to act',
    body: 'You, your employer, or EPFO, named on every gate. That axis exists nowhere on the real portal.',
  },
  {
    icon: 'shield',
    tone: 'violet',
    title: 'Mismatches found by rules',
    body: 'Your four records compared field by field. Never a language model, which could hallucinate a match.',
  },
];

const TONE = {
  teal: 'bg-teal-50 text-teal-700',
  sun: 'bg-sun-soft text-sun',
  sky: 'bg-sky-soft text-sky',
  violet: 'bg-violet-soft text-violet',
  coral: 'bg-coral-soft text-coral',
} as const;

export default function Home() {
  return (
    <main className="w-full">
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b border-ink-100">
        <div className="aurora" aria-hidden />
        <div className="mx-auto grid w-full max-w-[1120px] gap-10 px-5 py-16 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:py-24">
          <div className="rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-700/10 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.12em] text-teal-700">
              <Icon name="bolt" size={13} aria-hidden /> EPF withdrawal, unblocked
            </span>
            <h1 className="mt-4 text-[38px] leading-[1.05] font-bold tracking-tight text-ink-900 sm:text-[48px]">
              Find out what is holding your money{' '}
              <span className="text-teal-700">before you file</span>, not after you are rejected.
            </h1>
            <p className="mt-5 max-w-[52ch] text-[17.5px] leading-relaxed text-ink-700">
              EPFO rejects about one claim in four, usually because your details disagree across
              records that were never built to match. This finds every problem in one look.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="shine card-hover inline-flex items-center gap-2 rounded-md bg-teal-700 px-6 py-3.5 text-[15px] font-bold text-white hover:bg-teal-600"
              >
                Open a demo account
                <Icon name="route" size={17} aria-hidden />
              </Link>
              <a
                href="#how"
                className="rounded-md border-2 border-ink-100 bg-white px-6 py-3.5 text-[15px] font-semibold text-ink-700 transition hover:border-teal-700 hover:text-teal-700"
              >
                How it works
              </a>
            </div>
          </div>

          <div className="rise rise-2 rounded-xl border border-ink-100 bg-white p-6 shadow-[0_8px_30px_rgba(5,81,96,0.10)]">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-ink-500">
              The same person, same records
            </p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-signal-soft p-4">
                <p className="tabular text-[46px] leading-none font-bold text-signal">27</p>
                <p className="mt-2 text-[13px] leading-snug text-ink-700">
                  days, found one rejection at a time
                </p>
              </div>
              <div className="rounded-lg bg-go-soft p-4">
                <p className="tabular text-[46px] leading-none font-bold text-go">
                  {SPEC.baselineSettlementDays}
                </p>
                <p className="mt-2 text-[13px] leading-snug text-ink-700">
                  days, cleared in the right order
                </p>
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-500">
              Both numbers come out of the same rule engine.
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- stats */}
      <section className="bg-teal-800">
        <div className="mx-auto w-full max-w-[1120px] px-5 py-10">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {STATS.map((st) => (
              <div key={st.label}>
                <p className="tabular text-[30px] font-bold leading-none text-white">
                  <CountUp value={st.value} decimals={st.decimals} prefix={'prefix' in st ? st.prefix : ''} suffix={st.suffix} />
                </p>
                <p className="mt-1.5 text-[14px] font-semibold text-teal-100">{st.label}</p>
                <p className="text-[12px] text-teal-200/70">{st.sub}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[11.5px] leading-relaxed text-teal-200/60">
            Sources: EPFO annual figures and press releases; rejection rate from Factly / Dataful
            analysis of EPFO claim data. Interest rate as declared by the Central Board of Trustees.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------------- how */}
      <section id="how" className="mx-auto w-full max-w-[1120px] scroll-mt-16 px-5 py-16">
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-teal-600">How it works</p>
        <h2 className="mt-2 text-[30px] leading-tight font-bold tracking-tight text-ink-900">
          Three steps, no forms to hunt for.
        </h2>

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className={`card-hover rise rise-${i + 1} relative rounded-xl border border-ink-100 bg-white p-6`}
            >
              <span className="tabular absolute right-5 top-4 text-[42px] font-bold leading-none text-ink-100">
                {i + 1}
              </span>
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${
                  ['bg-teal-700', 'bg-sky', 'bg-coral'][i]
                }`}
              >
                <Icon name={s.icon} size={24} aria-hidden />
              </span>
              <h3 className="mt-4 text-[18px] font-bold text-ink-900">{s.title}</h3>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-700">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ what we do differently */}
      <section className="border-y border-ink-100 bg-white">
        <div className="mx-auto w-full max-w-[1120px] px-5 py-16">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-teal-600">
            What we do differently
          </p>
          <h2 className="mt-2 text-[30px] leading-tight font-bold tracking-tight text-ink-900">
            Diagnosis first. Then the fix.
          </h2>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {DIFF.map((d) => (
              <div
                key={d.title}
                className="card-hover flex gap-4 rounded-xl border border-ink-100 bg-white p-5"
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${TONE[d.tone]}`}
                >
                  <Icon name={d.icon} size={24} aria-hidden />
                </span>
                <div>
                  <h3 className="text-[17px] font-bold text-ink-900">{d.title}</h3>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-ink-700">{d.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- hosts */}
      <section className="mx-auto w-full max-w-[1120px] px-5 py-16">
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-teal-600">
          Why it is hard today
        </p>
        <h2 className="mt-2 text-[30px] leading-tight font-bold tracking-tight text-ink-900">
          One goal, scattered across six hosts
        </h2>
        <p className="mt-3 max-w-[56ch] text-[15.5px] leading-relaxed text-ink-700">
          Each is organised by kind of data, never by who has to act. So the steps that block each
          other have nowhere to connect.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HOSTS.map(([host, what, state]) => (
            <div key={host} className="rounded-lg border border-ink-100 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[12.5px] text-ink-900">{host}</span>
                {state === 'down' && (
                  <span className="shrink-0 rounded-xs bg-stop-soft px-1.5 py-0.5 text-[10.5px] font-bold text-stop">
                    DOWN
                  </span>
                )}
                {state === 'hidden' && (
                  <span className="shrink-0 rounded-xs bg-wait-soft px-1.5 py-0.5 text-[10.5px] font-bold text-wait">
                    HIDDEN
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12.5px] text-ink-500">{what}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- mocked */}
      <section className="mx-auto w-full max-w-[1120px] px-5">
        <div className="flex flex-col gap-4 rounded-xl border-2 border-teal-100 bg-teal-50 p-6 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700">
            <Icon name="check" size={26} aria-hidden />
          </span>
          <div className="flex-1">
            <h3 className="text-[17px] font-bold text-teal-900">Honest about what is real</h3>
            <p className="mt-1 text-[14.5px] leading-relaxed text-teal-800">
              No real Aadhaar, PAN or bank data anywhere. The gate logic, the day counts and the
              record matching are genuinely computed. Everything else is clearly marked.
            </p>
          </div>
          <Link
            href="/whats-mocked"
            className="shrink-0 rounded-md border-2 border-teal-700 bg-white px-5 py-2.5 text-[14px] font-bold text-teal-700 transition hover:bg-teal-700 hover:text-white"
          >
            What is mocked
          </Link>
        </div>
      </section>

      {/* --------------------------------------------------------------- cta */}
      <section className="mx-auto w-full max-w-[1120px] px-5 py-16">
        <div className="relative overflow-hidden rounded-2xl bg-teal-800 px-6 py-14 text-center shadow-[0_12px_40px_rgba(5,81,96,0.22)]">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(400px 200px at 80% 0%, rgba(9,133,133,0.6), transparent 60%)',
            }}
          />
          <h2 className="relative text-[28px] leading-tight font-bold tracking-tight text-white">
            See it on a real case
          </h2>
          <p className="relative mx-auto mt-3 max-w-[44ch] text-[15.5px] leading-relaxed text-teal-100">
            Six people, each stuck for a different reason. One tap, no password.
          </p>
          <Link
            href="/login"
            className="shine card-hover relative mt-7 inline-block rounded-md bg-white px-8 py-3.5 text-[15px] font-bold text-teal-900 hover:bg-teal-50"
          >
            Open a demo account
          </Link>
        </div>
      </section>
    </main>
  );
}
