import type { Provenance } from '@/lib/gates/types';

const LABEL: Record<Provenance['confidence'], { text: string; cls: string }> = {
  published: { text: 'Published rule', cls: 'bg-go-soft text-go' },
  reported: { text: 'Reported figure', cls: 'bg-ink-50 text-ink-700' },
  estimate: { text: 'Our estimate', cls: 'bg-wait-soft text-wait' },
};

/**
 * Every latency on screen can be traced. A number with no provenance is a number
 * nobody can check — and EPFO policy moves often enough that "when was this last
 * verified" is a fair question to be able to answer.
 */
export function WhyThisNumber({ days, provenance }: { days: number; provenance: Provenance }) {
  const l = LABEL[provenance.confidence];
  return (
    <details className="group mt-2">
      <summary className="cursor-pointer list-none text-[12.5px] font-semibold text-teal-700 hover:underline">
        Why {days === 0 ? 'no wait' : `${days} ${days === 1 ? 'day' : 'days'}`}?
      </summary>
      <div className="mt-2 rounded-sm border-l-4 border-ink-100 bg-ink-50 px-3 py-2.5">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${l.cls}`}>{l.text}</span>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-700">{provenance.source}</p>
        <p className="mt-1.5 text-[11.5px] text-ink-400">
          Last checked {provenance.sourcedAt}. If EPFO changes this, the fix is one line in the gate
          spec — no release.
        </p>
      </div>
    </details>
  );
}
