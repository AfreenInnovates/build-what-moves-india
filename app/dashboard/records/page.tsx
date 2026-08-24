import { redirect } from 'next/navigation';
import Link from 'next/link';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { PageHead } from '@/components/panels';
import { recordHealth } from '@/lib/insights';

export default async function RecordsPage() {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');

  const fields = recordHealth(c);
  const problems = fields.filter((f) => !f.agree).length;

  return (
    <main className="px-5 pb-28 pt-7 lg:pl-9 lg:pr-6">
      <PageHead
        icon="records"
        title="Record Health"
        lead="Your name, date of birth and parent's name, side by side across all four records. EPFO treats Aadhaar as the truth — everything else has to match it exactly, or a claim is rejected."
      />

      <div className="mt-6 max-w-[900px]">
        <div
          className={`mb-5 rounded-md border-l-4 px-4 py-3 text-[14.5px] font-semibold ${
            problems === 0 ? 'border-go bg-go-soft text-go' : 'border-stop bg-stop-soft text-stop'
          }`}
        >
          {problems === 0
            ? 'All three fields agree across every record. Nothing here will get you rejected.'
            : `${problems} field${problems === 1 ? '' : 's'} disagree. Each one is enough on its own to bounce a claim.`}
        </div>

        <div className="space-y-4">
          {fields.map((f) => (
            <div
              key={f.field}
              className={`overflow-hidden rounded-md border ${f.agree ? 'border-ink-100' : 'border-stop/30'}`}
            >
              <div
                className={`flex items-center justify-between px-4 py-2.5 ${
                  f.agree ? 'bg-ink-50' : 'bg-stop-soft'
                }`}
              >
                <p className="text-[15px] font-bold text-ink-900">{f.field}</p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${
                    f.agree ? 'bg-go text-white' : 'bg-stop text-white'
                  }`}
                >
                  {f.agree ? 'Agrees' : 'Mismatch'}
                </span>
              </div>
              <div className="divide-y divide-ink-100 bg-white">
                {f.values.map((v) => (
                  <div key={v.source} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-20 shrink-0 text-[13px] font-semibold text-ink-500">
                      {v.source}
                      {v.source === f.winner && (
                        <span className="ml-1 text-[10px] font-bold text-teal-700">TRUTH</span>
                      )}
                    </span>
                    <span
                      className={`flex-1 text-[15px] ${
                        v.agrees ? 'text-ink-900' : 'font-semibold text-stop'
                      }`}
                    >
                      {v.value}
                    </span>
                    <span aria-hidden>
                      {v.agrees ? (
                        <svg width="16" height="16" viewBox="0 0 20 20">
                          <circle cx="10" cy="10" r="9" fill="var(--color-go)" />
                          <path d="M6 10.5l2.6 2.5L14 7.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 20 20">
                          <circle cx="10" cy="10" r="9" fill="var(--color-stop)" />
                          <path d="M7 7l6 6M13 7l-6 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
                        </svg>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              {!f.agree && (
                <p className="border-t border-ink-100 bg-ink-50 px-4 py-2.5 text-[13px] text-ink-700">
                  Fix: everything must become the {f.winner} value. The bold rows above are what
                  needs changing.
                </p>
              )}
            </div>
          ))}
        </div>

        {problems > 0 && (
          <Link
            href="/dashboard/fix/records_agree"
            className="mt-6 inline-flex items-center rounded-sm bg-teal-700 px-6 py-3 text-[15px] font-bold text-white transition hover:bg-teal-600"
          >
            How to fix this →
          </Link>
        )}

        <p className="mt-6 text-[13px] leading-relaxed text-ink-500">
          Matching is rule-based, never a language model — a hallucinated match would cost someone
          their claim.
        </p>
      </div>
    </main>
  );
}
