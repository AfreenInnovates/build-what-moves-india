import type { Provenance } from '@/lib/gates/types';

/**
 * Where a waiting time comes from, in one line.
 *
 * This used to carry a confidence badge and a "last checked" date as well. Both
 * were true, and both were noise at the moment somebody just wants to know why
 * they are waiting - the source itself already says whether EPFO published the
 * number or we estimated it. The provenance is still on every route in the spec,
 * and still drives what this sentence says.
 */
export function WhyThisNumber({
  days,
  provenance,
  t,
}: {
  days: number;
  provenance: Provenance;
  t?: (s: string) => string;
}) {
  const tr = t ?? ((x: string) => x);
  return (
    <details className="group mt-2">
      <summary className="cursor-pointer list-none text-[14.5px] font-bold text-teal-700 hover:underline">
        {tr('Why')} {days === 0 ? tr('no wait') : `${days} ${days === 1 ? tr('day') : tr('days')}`}?
      </summary>
      <div className="mt-2.5 rounded-md border-l-4 border-teal-200 bg-ink-50 px-4 py-3.5">
        <p className="text-[15.5px] leading-relaxed text-ink-800">{tr(provenance.source)}</p>
      </div>
    </details>
  );
}
