import Link from 'next/link';
import { getT } from '@/lib/i18n';
import { Icon, type IconName } from '@/components/Icon';

export const dynamic = 'force-dynamic';

const SECTIONS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'route', title: 'Next.js + TypeScript', body: 'The pages, server routes and actions live together in one strongly typed app. That keeps the distance between a screen and the code behind it small and easy to review.' },
  { icon: 'money', title: 'Postgres as the source of truth', body: 'Cases, progress, employer requests and chat history are stored in Postgres. A refresh does not lose work, and the data model can move behind a managed pooler as traffic grows.' },
  { icon: 'gates', title: 'Modular domain code', body: 'The gate specification, predicates, resolver, language layer and portal screens are separate modules. A rule change is a data change, and the pure resolver can be tested without a browser or database.' },
  { icon: 'shield', title: 'Security at the boundary', body: 'Case IDs come from an httpOnly, same-site cookie, never from a request body. Server routes validate input, cap message size, use parameterised SQL and keep API keys on the server.' },
  { icon: 'key', title: 'Signed employer links', body: 'Employer links use an HMAC and timing-safe comparison. They carry no case ID, so forwarding a link does not expose a member’s private record.' },
  { icon: 'eye', title: 'A tight browser surface', body: 'The app sends only the data needed for the current action. Content security policy, frame protection, no-store API responses and a disabled camera policy reduce the places a mistake can hide.' },
  { icon: 'clock', title: 'Deterministic and explainable', body: 'The countdown is computed from a dependency graph and critical path, not invented by an AI model. Unit tests cover ordering and mismatch behaviour, so the result is repeatable.' },
  { icon: 'arrow', title: 'A practical scaling path', body: 'This proof of concept runs with a small pool and in-memory limits. For real load we would use shared rate-limit storage, a managed Postgres pooler, queues for slow work, structured logs, metrics and horizontally scaled stateless web instances.' },
];

export default async function TechnologyPage() {
  const t = await getT();
  return (
    <main className="mx-auto w-full max-w-[1000px] px-5 pb-28 pt-12">
      <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-teal-600">{t('Engineering')}</p>
      <h1 className="mt-2 max-w-[18ch] text-[36px] leading-[1.1] font-bold tracking-tight text-ink-900">{t('How Seven Gates is built')}</h1>
      <p className="mt-5 max-w-[72ch] text-[17px] leading-relaxed text-ink-700">{t('Seven Gates is a hackathon proof of concept, but the important parts are built like a real product: clear boundaries, secure defaults, small modules and rules you can inspect.')}</p>
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => <article key={s.title} className="rounded-xl border border-ink-100 bg-white p-5 shadow-[0_4px_18px_rgba(16,20,24,0.025)]"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Icon name={s.icon} size={22} aria-hidden /></span><h2 className="mt-4 text-[18px] font-bold text-ink-900">{t(s.title)}</h2><p className="mt-2 text-[15px] leading-relaxed text-ink-700">{t(s.body)}</p></article>)}
      </section>
      <section className="mt-12 rounded-xl border-2 border-teal-100 bg-teal-50 p-6"><h2 className="text-[22px] font-bold text-teal-900">{t('Built to be honest about what comes next')}</h2><p className="mt-2 text-[15.5px] leading-relaxed text-teal-900">{t('We have not pretended that a demo with six members is production scale. We have made the seams explicit so the next step is clear: shared infrastructure for shared limits, managed database connections, background jobs for slow integrations, and observability before adding more traffic.')}</p></section>
      <div className="mt-10 flex flex-wrap gap-3"><Link href="/whats-mocked" className="rounded-md bg-teal-700 px-5 py-3 text-[15px] font-bold text-white hover:bg-teal-600">{t("What's real and what's mocked")}</Link><Link href="/" className="rounded-md border-2 border-ink-100 px-5 py-3 text-[15px] font-semibold text-ink-700 hover:border-teal-700 hover:text-teal-700">{t('Back to the start')}</Link></div>
    </main>
  );
}
