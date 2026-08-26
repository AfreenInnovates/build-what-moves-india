import Link from 'next/link';
import { getT } from '@/lib/i18n';
import { CLAIMS, HONESTY, CHECKED_ON } from '@/lib/comparison';
import { Icon } from '@/components/Icon';

export const dynamic = 'force-dynamic';

const KIND: Record<string, { label: string; cls: string }> = {
  'first-hand': { label: 'We opened it ourselves', cls: 'bg-go-soft text-go' },
  circular: { label: 'From the EPFO circular', cls: 'bg-teal-50 text-teal-800' },
  published: { label: 'Published figure', cls: 'bg-ink-50 text-ink-700' },
};

const STATE: Record<string, string> = {
  Real: 'bg-go-soft text-go',
  'Built here instead': 'bg-wait-soft text-wait',
  'Not connected': 'bg-stop-soft text-stop',
  Invented: 'bg-ink-50 text-ink-700',
};

export default async function ComparePage() {
  const t = await getT();

  return (
    <main className="mx-auto w-full max-w-[1000px] px-5 pb-28 pt-12">
      <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-teal-600">
        {t('Side by side')}
      </p>
      <h1 className="mt-2 max-w-[22ch] text-[36px] leading-[1.1] font-bold tracking-tight text-ink-900">
        {t('EPFO today, and what we changed')}
      </h1>
      <p className="mt-5 max-w-[70ch] text-[17px] leading-relaxed text-ink-700">
        {t(
          'Everything we say about EPFO here, we checked ourselves on their own site or in their own orders. Each row says where it came from and when we looked. If we could only find it second-hand, the row says that too. There is no point arguing about a public service using facts that are wrong.',
        )}
      </p>
      <p className="mt-3 text-[14px] text-ink-500">
        {t('Last checked')}: <span className="font-semibold text-ink-700">{CHECKED_ON}</span>.{' '}
        {t('EPFO changes often. If you are reading this much later, check it again.')}
      </p>

      <div className="mt-4 rounded-md border-l-4 border-teal-700 bg-teal-50 px-4 py-3.5">
        <p className="text-[14.5px] leading-relaxed text-teal-900">
          {t(
            'EPFO has got better. The site was rebuilt, fixing your details got easier in January 2025, and most small withdrawals are now paid automatically. We say so below where it is true. What has not changed: nothing tells you what is wrong with your record until a claim comes back refused.',
          )}
        </p>
      </div>

      {/* ------------------------------------------------ the comparison itself */}
      <section className="mt-10 space-y-4">
        {CLAIMS.map((c) => (
          <article key={c.feature} className="overflow-hidden rounded-lg border border-ink-100">
            <header className="border-b border-ink-100 bg-ink-50 px-5 py-3">
              <h2 className="text-[17px] font-bold text-ink-900">{t(c.feature)}</h2>
            </header>

            <div className="grid gap-px bg-ink-100 md:grid-cols-2">
              <div className="bg-white p-5">
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-stop">
                  {t('EPFO today')}
                </p>
                <p className="mt-2.5 text-[15.5px] leading-relaxed text-ink-800">{t(c.epfo)}</p>
              </div>
              <div className="bg-teal-50/60 p-5">
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-teal-700">
                  {t('Here')}
                </p>
                <p className="mt-2.5 text-[15.5px] leading-relaxed text-teal-900">{t(c.ours)}</p>
              </div>
            </div>

            <footer className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-ink-100 bg-white px-5 py-3">
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold ${KIND[c.kind].cls}`}
              >
                {t(KIND[c.kind].label)}
              </span>
              <span className="min-w-0 text-[13.5px] leading-relaxed text-ink-500">
                {t(c.source)}
              </span>
            </footer>
          </article>
        ))}
      </section>

      {/* ------------------------------------------------------------- honesty */}
      <section className="mt-14">
        <h2 className="text-[26px] font-bold tracking-tight text-ink-900">
          {t('What really works here, and what we built to stand in')}
        </h2>
        <p className="mt-3 max-w-[70ch] text-[16px] leading-relaxed text-ink-700">
          {t(
            'Something dealing with ID documents and other people’s money should be clear about which parts are real. Nothing here is hidden - this page is linked at the bottom of every page.',
          )}
        </p>

        <div className="mt-6 overflow-hidden rounded-lg border border-ink-100">
          {HONESTY.map((h, i) => (
            <div
              key={h.thing}
              className={`grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-start ${
                i > 0 ? 'border-t border-ink-100' : ''
              }`}
            >
              <div>
                <p className="text-[16px] font-bold text-ink-900">{t(h.thing)}</p>
                <p className="mt-1 max-w-[80ch] text-[15px] leading-relaxed text-ink-700">
                  {t(h.detail)}
                </p>
              </div>
              <span
                className={`justify-self-start rounded-full px-3 py-1 text-[12.5px] font-bold sm:justify-self-end ${
                  STATE[h.state] ?? 'bg-ink-50 text-ink-700'
                }`}
              >
                {t(h.state)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-lg border-2 border-ink-100 bg-white p-6">
        <h2 className="text-[20px] font-bold tracking-tight text-ink-900">
          {t('If you think something here is wrong')}
        </h2>
        <p className="mt-2 max-w-[70ch] text-[15.5px] leading-relaxed text-ink-700">
          {t(
            'Then it should be fixed. Every row above says where it came from, so you can check it instead of trusting us. This is an independent project. It is not run by EPFO and not approved by them.',
          )}
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-teal-700 px-5 py-3 text-[15px] font-bold text-white hover:bg-teal-600"
        >
          <Icon name="back" size={16} aria-hidden />
          {t('Back to the start')}
        </Link>
      </section>
    </main>
  );
}
