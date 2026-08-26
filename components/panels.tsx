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
    <div className="border-b border-ink-100 pb-6" data-tour="page">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          <Icon name={icon} size={24} aria-hidden />
        </span>
        <h1 className="text-[28px] font-bold tracking-tight text-ink-900">{title}</h1>
      </div>
      {lead && <p className="mt-3 max-w-[62ch] text-[17px] leading-relaxed text-ink-700">{lead}</p>}
    </div>
  );
}

const SEV = {
  blocking: { bar: 'border-stop', chip: 'bg-stop text-white', word: 'Blocking' },
  warning: { bar: 'border-wait', chip: 'bg-wait text-white', word: 'Needs attention' },
  info: { bar: 'border-teal-700', chip: 'bg-teal-700 text-white', word: 'Worth knowing' },
  good: { bar: 'border-go', chip: 'bg-go text-white', word: 'All clear' },
} as const;

/**
 * The whole card is the target when there is somewhere to go. A small "Fix this"
 * link inside a large card is a needlessly small thing to hit, especially on a
 * phone.
 */
export function AlertCard({ alert }: { alert: AlertData }) {
  const s = SEV[alert.severity];

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[17px] font-bold text-ink-900">{alert.title}</p>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold ${s.chip}`}>
          {s.word}
        </span>
      </div>
      <p className="mt-2 text-[15.5px] leading-relaxed text-ink-700">{alert.detail}</p>
      {alert.gateId && (
        <span className="mt-3 inline-flex items-center gap-1.5 text-[14.5px] font-bold text-teal-700 group-hover:underline">
          Fix this
          <Icon name="arrow" size={16} aria-hidden />
        </span>
      )}
    </>
  );

  const shell = `block rounded-lg border border-ink-100 border-l-4 bg-white px-5 py-4 ${s.bar}`;

  if (!alert.gateId) return <div className={shell}>{body}</div>;

  return (
    <Link href={`/dashboard/fix/${alert.gateId}`} className={`group card-hover ${shell}`}>
      {body}
    </Link>
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
    <div className="rounded-lg border border-ink-100 bg-white px-5 py-4">
      <p className="text-[12.5px] font-bold uppercase tracking-[0.08em] text-ink-500">{label}</p>
      <p className={`tabular mt-1.5 text-[28px] font-bold leading-none ${colour}`}>{value}</p>
      {sub && <p className="mt-2 text-[14px] leading-snug text-ink-500">{sub}</p>}
    </div>
  );
}
