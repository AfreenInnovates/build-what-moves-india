import Link from 'next/link';
import { listMembersWithService } from '@/lib/case';
import { signIn } from '@/app/actions';
import { SPEC } from '@/lib/gates/spec';
import { resolve } from '@/lib/gates/resolve';
import { deriveFacts } from '@/lib/gates/facts';
import { documentsFor, intakeFor, countBlockingMismatches } from '@/lib/case';
import { Tag } from '@/components/ui';

const SCENARIO: Record<string, { label: string; tone: 'error' | 'success' | 'warning' }> = {
  rejected: { label: 'Claim rejected', tone: 'error' },
  ready: { label: 'Ready to file', tone: 'success' },
  advance: { label: 'Advance, still employed', tone: 'warning' },
};

export default async function LoginPage() {
  // one round trip for everything the picker needs
  const cards = (await listMembersWithService()).map((m) => {
    const mismatches = countBlockingMismatches(documentsFor(m.slug));
    const r = resolve(SPEC, deriveFacts(m, m.service, mismatches, intakeFor(m.slug)));
    return { m, days: r.totalDays, blocking: r.blockingCount };
  });

  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 pb-24 pt-10">
      <Link href="/" className="text-[14px] font-medium text-teal-700 hover:underline">
        ← Home
      </Link>

      <h1 className="mt-4 text-[34px] leading-[1.12] font-bold tracking-tight text-ink-900">
        Pick a case to open
      </h1>
      <p className="mt-3 max-w-[64ch] text-[16.5px] leading-relaxed text-ink-700">
        Six synthetic members, each stuck for a different real reason. No typing, no password screen.
        Every number below is computed live — none of them is written into this page.
      </p>

      <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ m, days, blocking }) => {
          const s = SCENARIO[m.scenario] ?? { label: m.scenario, tone: 'warning' as const };
          return (
            <form key={m.id} action={signIn} className="contents">
              <input type="hidden" name="slug" value={m.slug} />
              <button className="flex h-full flex-col rounded-md border-2 border-ink-100 bg-white p-5 text-left transition hover:border-teal-700 hover:shadow-[0_2px_12px_rgba(5,81,96,0.09)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[17px] font-bold text-ink-900">{m.display_name}</p>
                    <Tag tone={s.tone}>{s.label}</Tag>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`tabular text-[30px] font-bold leading-none ${
                        blocking === 0 ? 'text-go' : 'text-signal'
                      }`}
                    >
                      {days}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                      days
                    </p>
                  </div>
                </div>

                <p className="mt-3 flex-1 text-[14px] leading-relaxed text-ink-700">
                  {m.headline}
                </p>

                <p className="mt-4 border-t border-ink-100 pt-3 text-[12.5px] text-ink-400">
                  <span className="tabular">UAN {m.uan}</span> · {m.demo_password} ·{' '}
                  {blocking === 0 ? 'nothing blocking' : `${blocking} gates blocking`}
                </p>
              </button>
            </form>
          );
        })}


      </div>

      <p className="mt-8 max-w-[76ch] text-[13.5px] leading-relaxed text-ink-500">
        Credentials are printed on each card because a login wall between a reviewer and the product
        helps nobody. None of these accounts contains real Aadhaar, PAN or bank data, and the
        documents attached to them are watermarked synthetic files with deliberately invalid
        identifiers.
      </p>
    </main>
  );
}
