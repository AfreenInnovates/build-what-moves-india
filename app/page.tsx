import Link from 'next/link';
import { SPEC } from '@/lib/gates/spec';
import { LANGUAGE_NATIVE } from '@/lib/language';
import { ScrollTo } from '@/components/ScrollTo';
import { Icon, type IconName } from '@/components/Icon';
import { CountUp } from '@/components/CountUp';
import { getT } from '@/lib/i18n';

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
  { value: 22, decimals: 0, prefix: '~', suffix: '%', label: 'claims rejected', sub: 'FY 2024-25' },
  { value: 8.25, decimals: 2, suffix: '%', label: 'annual interest', sub: 'FY 2024-25' },
] as const;

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'preflight',
    title: 'Sign in once',
    body: 'A captcha and a code sent to your phone, and you are in. That is the only time you log in - your case then stays at a link you can come back to. In this demo it is just the password on each card.',
  },
  {
    icon: 'search',
    title: 'See what is stopping you',
    body: 'All seven checks in one look, before you send anything. Our helper explains each problem in plain words - in your language, out loud if you want.',
  },
  {
    icon: 'route',
    title: 'Clear them in the right order',
    body: 'Work down the list one at a time, starting with whatever is costing you the most days. The count goes down as each one is done.',
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

/** What Saathi actually does, said plainly. */
const SAATHI: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'phone',
    title: 'Voice or typing, whichever suits you',
    body: 'Tap the mic and say it, or type it. Answers come back written and read aloud, so it works if reading is hard.',
  },
  {
    icon: 'explain',
    title: '"Walk me through" starts a guided tour',
    body: 'It takes over the screen, moves page to page and rings each part in turn, explaining what it is for and why it matters to you.',
  },
  {
    icon: 'records',
    title: 'It only knows your case',
    body: 'Every answer is about your own records and your own blockers. It cannot see anybody else, and it will not answer about them.',
  },
];

const LANGUAGES = Object.values(LANGUAGE_NATIVE);

export default async function Home() {
  const t = await getT();
  return (
    <main className="home-page w-full overflow-hidden">
      {/*
        Said once, plainly, at the very top. A tool about somebody's provident
        fund that looked official but was not would be a genuinely harmful thing
        to put in front of people.
      */}
      <div className="border-b border-wait/30 bg-wait-soft">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center gap-x-2 gap-y-1 px-5 py-2.5">
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-wait">
            {t('Not EPFO')}
          </span>
          <p className="text-[13px] leading-snug text-ink-800">
            {t('An independent prototype for the Build What Moves India hackathon. Not connected to EPFO, and not approved by them.')}{' '}
            <a
              href="https://buildwhatmovesindia.com/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline hover:text-teal-700"
            >
              {t('About the hackathon')}
            </a>
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------------- hero */}
      <section className="home-hero relative isolate overflow-hidden border-b border-ink-100">
        <div className="aurora" aria-hidden />
        <div className="home-hero-art" aria-hidden />
        <div className="home-hero-grid mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
          <div className="rise relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-700/10 bg-white/70 px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-teal-700 shadow-[0_4px_16px_rgba(5,81,96,0.06)] backdrop-blur-sm">
              <Icon name="bolt" size={13} aria-hidden /> {t('EPF withdrawal, unblocked')}
            </span>
            <h1 className="mt-5 max-w-[12ch] text-[43px] leading-[0.99] font-bold tracking-[-0.045em] text-ink-900 sm:text-[58px] lg:text-[66px]">
              {t('Your provident fund,')}{' '}
              <span className="text-teal-700">{t('without the guesswork')}</span>.
            </h1>
            <p className="mt-6 max-w-[51ch] text-[17px] leading-relaxed text-ink-700 sm:text-[18px]">
              {t('Find out what is holding your money before you file, not after you are rejected. EPFO turned down about 22 per cent of claims in 2024-25 - roughly one in five - usually because your details disagree across records that were never built to match. This finds every problem in one look.')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="shine card-hover inline-flex items-center gap-2 rounded-md bg-teal-700 px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_22px_rgba(5,81,96,0.22)] hover:bg-teal-600"
              >
                {t('Open a demo account')}
                <Icon name="route" size={17} aria-hidden />
              </Link>
              <ScrollTo
                to="how"
                className="rounded-md border-2 border-ink-100 bg-white px-6 py-3.5 text-[15px] font-semibold text-ink-700 transition hover:border-teal-700 hover:text-teal-700"
              >
                {t('How it works')}
              </ScrollTo>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-semibold text-ink-500">
              {['No real documents needed', 'A clear next step', 'Your data stays private'].map((point) => (
                <span key={point} className="inline-flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-700 text-white"><Icon name="check" size={10} aria-hidden /></span>
                  {t(point)}
                </span>
              ))}
            </div>
          </div>

          <div className="home-proof rise rise-2 relative z-10 lg:ml-4">
            <div className="home-proof-card rounded-2xl border border-white/90 bg-white/90 p-5 shadow-[0_20px_54px_rgba(5,81,96,0.18)] backdrop-blur-md sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-ink-500">
                  {t('The same person, same records')}
                </p>
                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10.5px] font-bold text-teal-700">PRE-FLIGHT</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-signal/10 bg-signal-soft/70 p-4">
                  <p className="tabular text-[50px] leading-none font-bold tracking-tight text-signal">27</p>
                  <p className="mt-2 text-[13px] leading-snug text-ink-700">
                    {t('days, found one rejection at a time')}
                  </p>
                </div>
                <div className="rounded-xl border border-go/10 bg-go-soft/80 p-4">
                  <p className="tabular text-[50px] leading-none font-bold tracking-tight text-go">
                    {SPEC.baselineSettlementDays}
                  </p>
                  <p className="mt-2 text-[13px] leading-snug text-ink-700">
                    {t('days, cleared in the right order')}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-ink-50 px-3.5 py-3">
                <span className="mt-0.5 text-teal-700"><Icon name="gates" size={17} aria-hidden /></span>
                <p className="text-[12.5px] leading-relaxed text-ink-700">
                  {t('Both numbers come out of the same rule engine.')}
                </p>
              </div>

              {/*
                The numbers on their own are a claim. These three say where the
                claim comes from, in the plainest words we could find, because
                the argument is only as good as the facts under it.
              */}
              <dl className="mt-4 space-y-2 border-t border-ink-100 pt-4">
                {[
                  ['1 in 5', t('claims came back refused last year')],
                  ['16 lakh', t('complaints filed in a single year')],
                  ['7', t('things must all be right before you are paid')],
                ].map(([n, what]) => (
                  <div key={n} className="flex items-baseline gap-2.5">
                    <dt className="tabular w-[62px] shrink-0 text-[15px] font-bold text-ink-900">
                      {n}
                    </dt>
                    <dd className="text-[12.5px] leading-snug text-ink-600">{what}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- stats */}
      <section className="home-stats relative overflow-hidden bg-teal-800">
        <div className="mx-auto w-full max-w-[1120px] px-5 py-10">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {STATS.map((st) => (
              <div key={st.label}>
                <p className="tabular text-[30px] font-bold leading-none text-white">
                  <CountUp value={st.value} decimals={st.decimals} prefix={'prefix' in st ? st.prefix : ''} suffix={st.suffix} />
                </p>
                <p className="mt-1.5 text-[14px] font-semibold text-teal-100">{t(st.label)}</p>
                <p className="text-[12px] text-teal-200/70">{t(st.sub)}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[11.5px] leading-relaxed text-teal-200/60">
            Sources: EPFO annual figures and press releases; rejection rate from Factly / Dataful
            analysis of EPFO claim data. Interest rate as declared by the Central Board of Trustees.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------ what goes wrong */}
      <section className="border-b border-ink-100 bg-white">
        <div className="mx-auto w-full max-w-[1120px] px-5 py-16">
          <p className="reveal text-[13px] font-bold uppercase tracking-[0.14em] text-teal-600">
            {t('Why this is hard')}
          </p>
          <h2 className="reveal mt-2 max-w-[20ch] text-[32px] leading-tight font-bold tracking-tight text-ink-900">
            {t('Nobody tells you what is wrong until it is too late')}
          </h2>
          <p className="reveal mt-3.5 max-w-[62ch] text-[18px] leading-relaxed text-ink-700">
            {t(
              'You work for years. You leave a job. You ask for your own savings. And then it comes back refused, for a reason nobody mentioned while you were waiting.'
            )}
          </p>

          <div className="reveal reveal-2 mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: 'records' as const,
                t: 'One letter out of place',
                d: 'Your name is spelt slightly differently on your bank record than on Aadhaar. A computer compares them letter by letter and sends the claim back.',
              },
              {
                icon: 'employer' as const,
                t: 'Waiting on your old company',
                d: 'Some of it can only be fixed by an employer you have already left, on a website you cannot see, with nobody telling them it is waiting.',
              },
              {
                icon: 'alerts' as const,
                t: 'One refusal at a time',
                d: 'Fix the first problem, wait two weeks, get refused for the second. Seven conditions, discovered one by one.',
              },
              {
                icon: 'preflight' as const,
                t: 'No date, ever',
                d: 'You get a status word on a different website. Never a day. Never a reason. Never what to do next.',
              },
            ].map((c) => (
              <article key={c.t} className="rounded-xl border border-ink-100 bg-white p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-stop-soft text-stop">
                  <Icon name={c.icon} size={22} aria-hidden />
                </span>
                <h3 className="mt-4 text-[17.5px] font-bold text-ink-900">{t(c.t)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-ink-700">{t(c.d)}</p>
              </article>
            ))}
          </div>

          <div className="reveal mt-8 rounded-xl border-l-4 border-teal-700 bg-teal-50 px-5 py-4">
            <p className="text-[13.5px] font-bold uppercase tracking-[0.08em] text-teal-700">
              {t('So we turned it around')}
            </p>
            <p className="mt-2.5 max-w-[74ch] text-[17.5px] leading-relaxed text-teal-900">
              {t(
                'Show all seven at once, before anything is sent. Say which one is actually costing you time and which is not. Name who has to fix each one - you, your old company, or EPFO. And give a number of days that goes down as you finish each step.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- how */}
      <section id="how" className="home-how relative scroll-mt-16 overflow-hidden">
        <div className="relative mx-auto w-full max-w-[1120px] px-5 py-20">
          <p className="reveal text-[12px] font-bold uppercase tracking-[0.14em] text-teal-600">{t('How it works')}</p>
          <h2 className="mt-2 text-[30px] leading-tight font-bold tracking-tight text-ink-900">
            {t('Three steps, and no forms to go looking for.')}
          </h2>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className={`home-step home-step-${i + 1} card-hover rise rise-${i + 1} relative overflow-hidden rounded-2xl border border-ink-100 bg-white p-6 shadow-[0_1px_2px_rgba(16,20,24,0.02)]`}
              >
                <span className="tabular absolute right-5 top-4 text-[42px] font-bold leading-none">
                  {i + 1}
                </span>
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${
                    ['bg-teal-700', 'bg-sky', 'bg-coral'][i]
                  }`}
                >
                  <Icon name={s.icon} size={24} aria-hidden />
                </span>
                <h3 className="mt-4 text-[18px] font-bold text-ink-900">{t(s.title)}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-700">{t(s.body)}</p>
              </div>
            ))}
          </div>

          <div className="home-route-panel mt-7 overflow-hidden rounded-2xl border border-teal-900/10 shadow-[0_16px_42px_rgba(5,81,96,0.14)]">
            <div className="home-route-panel-copy relative max-w-[510px] p-6 sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.13em] text-teal-50">
                <Icon name="route" size={13} aria-hidden /> {t('One connected route')}
              </span>
              <h3 className="mt-4 text-[25px] leading-tight font-bold tracking-tight text-white sm:text-[30px]">
                {t('From “what happened?” to a clear next move.')}
              </h3>
              <p className="mt-3 max-w-[44ch] text-[14.5px] leading-relaxed text-teal-100">
                {t('Seven Gates turns scattered records and portal steps into one calm path you can follow.')}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Your records', 'The blocker', 'The next step'].map((item) => (
                  <span key={item} className="rounded-full bg-white/12 px-3 py-1.5 text-[12px] font-semibold text-white ring-1 ring-white/15">
                    {t(item)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      {/* ------------------------------------------------ what we do differently */}
      <div className="home-difference relative isolate overflow-hidden">
        <div className="home-difference-art" aria-hidden />
        <div className="mx-auto w-full max-w-[1120px] px-5 py-16">
          <p className="reveal text-[12px] font-bold uppercase tracking-[0.14em] text-teal-600">
            {t('What we do differently')}
          </p>
          <h2 className="mt-2 text-[30px] leading-tight font-bold tracking-tight text-ink-900">
            {t('Diagnosis first. Then the fix.')}
          </h2>

          <div className="reveal reveal-2 mt-9 grid gap-4 sm:grid-cols-2">
            {DIFF.map((d) => (
              <div
                key={d.title}
                className={`home-diff-card home-diff-card-${d.tone} card-hover relative flex gap-4 rounded-xl border border-ink-100 bg-white/90 p-5 shadow-[0_4px_18px_rgba(16,20,24,0.025)] backdrop-blur-sm`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${TONE[d.tone]}`}
                >
                  <Icon name={d.icon} size={24} aria-hidden />
                </span>
                <div>
                  <h3 className="text-[17px] font-bold text-ink-900">{t(d.title)}</h3>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-ink-700">{t(d.body)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </section>

      {/* -------------------------------------------------------------- saathi */}
      <section className="home-saathi relative isolate overflow-hidden border-b border-ink-100 bg-teal-50/40">
        <div className="home-saathi-art" aria-hidden />
        <div className="mx-auto grid w-full max-w-[1120px] gap-10 px-5 py-16 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div className="reveal">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-teal-600">
              {t('Saathi, the guide inside')}
            </p>
            <h2 className="mt-2 text-[30px] leading-tight font-bold tracking-tight text-ink-900">
              {t('Ask in your language. Out loud, if you prefer.')}
            </h2>
            <p className="mt-3 max-w-[58ch] text-[15.5px] leading-relaxed text-ink-700">
              The people this is built for do not all read English, and many would rather speak than
              type on a phone. So Saathi takes either, in {LANGUAGES.length} languages, and answers
              in whichever one you used - switch mid-conversation and it switches with you.
            </p>

            <ul className="mt-6 space-y-3">
              {SAATHI.map((f) => (
                <li key={f.title} className="flex gap-3.5">
                  <span className="home-saathi-icon mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 shadow-[0_1px_3px_rgba(5,81,96,0.10)]">
                    <Icon name={f.icon} size={19} aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-[16px] font-bold text-ink-900">{t(f.title)}</h3>
                    <p className="mt-0.5 text-[14.5px] leading-relaxed text-ink-700">{t(f.body)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="home-language-card reveal reveal-2 relative rounded-2xl border border-white/90 bg-white/90 p-6 shadow-[0_16px_42px_rgba(5,81,96,0.12)] backdrop-blur-md">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-ink-500">
              {t('Speak or type, in any of these')}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <li
                  key={l}
                  className="rounded-full bg-teal-50 px-3 py-1.5 text-[14px] font-semibold text-teal-900"
                >
                  {l}
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-ink-100 pt-4 text-[13.5px] leading-relaxed text-ink-500">
              {t('Speech in and out runs on Sarvam, built for Indian languages. The day counts Saathi quotes come from the same rule engine as the rest of the site, never from the model, so it cannot invent a number.')}
            </p>
          </div>
        </div>

      {/* ------------------------------------------------------------- hosts */}
      <div className="home-hosts relative overflow-hidden">
        <div className="relative mx-auto w-full max-w-[1120px] px-5 py-20">
          <p className="reveal text-[12px] font-bold uppercase tracking-[0.14em] text-teal-600">
            {t('Why it is hard today')}
          </p>
          <h2 className="mt-2 text-[30px] leading-tight font-bold tracking-tight text-ink-900">
            {t('One goal, scattered across six hosts')}
          </h2>
          <p className="mt-3 max-w-[56ch] text-[15.5px] leading-relaxed text-ink-700">
            {t('Each is organised by kind of data, never by who has to act. So the steps that block each other have nowhere to connect.')}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {HOSTS.map(([host, what, state]) => (
              <div key={host} className="home-host-card rounded-lg border border-ink-100 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[12.5px] text-ink-900">{host}</span>
                  {state === 'down' && (
                    <span className="shrink-0 rounded-xs bg-stop-soft px-1.5 py-0.5 text-[10.5px] font-bold text-stop">
                      {t('DOWN')}
                    </span>
                  )}
                  {state === 'hidden' && (
                    <span className="shrink-0 rounded-xs bg-wait-soft px-1.5 py-0.5 text-[10.5px] font-bold text-wait">
                      {t('HIDDEN')}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[12.5px] text-ink-500">{t(what)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      </section>

      {/* ------------------------------------------------------------- mocked */}
      <section className="home-final-notice mx-auto w-full max-w-[1120px] px-5">
        <div className="flex flex-col gap-4 rounded-xl border-2 border-teal-100 bg-teal-50 p-6 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700">
            <Icon name="check" size={26} aria-hidden />
          </span>
          <div className="flex-1">
            <h3 className="text-[17px] font-bold text-teal-900">{t('Straight about what is real')}</h3>
            <p className="mt-1 text-[14.5px] leading-relaxed text-teal-800">
              {t('No real Aadhaar, PAN or bank details anywhere. The seven checks and the day count are worked out for real. Everything we built to stand in for something else is named, side by side with what EPFO does today.')}
            </p>
          </div>
          <Link
            href="/compare"
            className="shrink-0 rounded-md border-2 border-teal-700 bg-white px-5 py-2.5 text-[14px] font-bold text-teal-700 transition hover:bg-teal-700 hover:text-white"
          >
            {t('See the differences')}
          </Link>
        </div>
      </section>

      {/* --------------------------------------------------------------- cta */}
      <section className="home-final-cta mx-auto w-full max-w-[1120px] px-5 py-16">
        <div className="home-cta relative overflow-hidden rounded-2xl bg-teal-800 px-6 py-14 text-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(400px 200px at 80% 0%, rgba(9,133,133,0.6), transparent 60%)',
            }}
          />
          <h2 className="relative text-[28px] leading-tight font-bold tracking-tight text-white">
            {t('See it on a real case')}
          </h2>
          <p className="relative mx-auto mt-3 max-w-[44ch] text-[15.5px] leading-relaxed text-teal-100">
            {t('Six people, each stuck for a different reason. One tap, no password.')}
          </p>
          <Link
            href="/login"
            className="shine card-hover relative mt-7 inline-block rounded-md bg-white px-8 py-3.5 text-[15px] font-bold text-teal-900 hover:bg-teal-50"
          >
            {t('Open a demo account')}
          </Link>
        </div>
      </section>
    </main>
  );
}
