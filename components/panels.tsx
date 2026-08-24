import Link from 'next/link';
import type { Alert as AlertData } from '@/lib/insights';
import { Icon, type IconName } from './Icon';

/** The heading every section page opens with. */
export function PageHead({
  icon,
  title,
  lead,
}: {
  icon: IconName;
  title: string;
  lead?: string;
}) {
  return (
    <div className="border-b border-ink-100 pb-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          <Icon name={icon} size={22} aria-hidden />
        </span>
        <h1 className="text-[26px] font-bold tracking-tight text-ink-900">{title}</h1>
      </div>
      {lead && <p className="mt-2 max-w-[64ch] text-[15px] leading-relaxed text-ink-700">{lead}</p>}
    </div>
  );
}

const SEV = {
  blocking: { bar: 'border-stop', chip: 'bg-stop text-white', word: 'Blocking' },
  warning: { bar: 'border-wait', chip: 'bg-wait text-white', word: 'Needs attention' },
  info: { bar: 'border-teal-700', chip: 'bg-teal-700 text-white', word: 'Worth knowing' },
  good: { bar: 'border-go', chip: 'bg-go text-white', word: 'All clear' },
} as const;

export function AlertCard({ alert, caseId }: { alert: AlertData; caseId?: string }) {
  const s = SEV[alert.severity];
  return (
    <div className={`card-hover rounded-md border border-ink-100 border-l-4 bg-white px-4 py-3.5 ${s.bar}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15.5px] font-bold text-ink-900">{alert.title}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${s.chip}`}>
          {s.word}
        </span>
      </div>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-700">{alert.detail}</p>
      {alert.gateId && (
        <Link
          href={`/dashboard/fix/${alert.gateId}`}
          className="mt-2.5 inline-flex min-h-[24px] items-center text-[13.5px] font-semibold text-teal-700 hover:underline"
        >
          Fix this →
        </Link>
      )}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  tone = 'ink',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'ink' | 'signal' | 'go' | 'stop';
}) {
  const colour = {
    ink: 'text-ink-900',
    signal: 'text-signal',
    go: 'text-go',
    stop: 'text-stop',
  }[tone];
  return (
    <div className="rounded-md border border-ink-100 bg-white px-4 py-4">
      <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink-500">{label}</p>
      <p className={`tabular mt-1 text-[26px] font-bold leading-none ${colour}`}>{value}</p>
      {sub && <p className="mt-1.5 text-[13px] leading-snug text-ink-500">{sub}</p>}
    </div>
  );
}
