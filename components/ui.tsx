import Link from 'next/link';

/**
 * USWDS-shaped primitives. The federal design system solved these patterns for
 * exactly our problem — dense procedural information, read under stress, on bad
 * hardware — so we borrow the structure and keep our own colour.
 */

type Tone = 'info' | 'warning' | 'error' | 'success';

const TONE: Record<Tone, { bar: string; bg: string; label: string }> = {
  info: { bar: 'bg-teal-700', bg: 'bg-teal-50', label: 'text-teal-700' },
  warning: { bar: 'bg-signal', bg: 'bg-signal-soft', label: 'text-signal' },
  error: { bar: 'bg-stop', bg: 'bg-stop-soft', label: 'text-stop' },
  success: { bar: 'bg-go', bg: 'bg-go-soft', label: 'text-go' },
};

/** Alert: a heavy left accent bar carrying status, USWDS's most recognisable pattern. */
export function Alert({
  tone = 'info',
  title,
  children,
}: {
  tone?: Tone;
  title: string;
  children: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div className={`flex overflow-hidden rounded-sm ${t.bg}`}>
      <div className={`w-1.5 shrink-0 ${t.bar}`} aria-hidden />
      <div className="px-4 py-3.5">
        <p className={`text-[13px] font-bold uppercase tracking-[0.08em] ${t.label}`}>{title}</p>
        <div className="mt-1.5 text-[15px] leading-relaxed text-ink-800">{children}</div>
      </div>
    </div>
  );
}

/** Summary box: the "here is the thing you actually came for" container. */
export function SummaryBox({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-sm border-2 border-teal-200 bg-teal-50 px-5 py-4 ${className}`}>
      {title && (
        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-teal-700">{title}</p>
      )}
      <div className={title ? 'mt-2' : ''}>{children}</div>
    </div>
  );
}

/** Process list: numbered steps joined by a vertical rule. */
export function ProcessList({ steps }: { steps: string[] }) {
  return (
    <ol className="process-list">
      {steps.map((s, i) => (
        <li key={i}>
          <span className="tabular absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-teal-700 bg-white text-[13px] font-bold text-teal-700">
            {i + 1}
          </span>
          <p className="pt-0.5 text-[15.5px] leading-relaxed text-ink-700">{s}</p>
        </li>
      ))}
    </ol>
  );
}

/** Step indicator: where you are in a multi-stage process. */
export function StepIndicator({
  steps,
}: {
  steps: { label: string; state: 'done' | 'current' | 'todo' }[];
}) {
  return (
    <ol className="flex gap-1.5" aria-label="Progress">
      {steps.map((s) => (
        <li key={s.label} className="flex-1">
          <span
            className={`block h-1.5 rounded-xs ${
              s.state === 'done' ? 'bg-go' : s.state === 'current' ? 'bg-signal' : 'bg-ink-100'
            }`}
          />
          <span
            className={`mt-1.5 hidden text-[11px] leading-tight sm:block ${
              s.state === 'todo' ? 'text-ink-400' : 'text-ink-700'
            }`}
          >
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Buttons: 4px radius, bold, generous target. USWDS sizing. */
const BTN =
  'inline-flex items-center justify-center rounded-sm px-6 py-3 text-[16px] font-bold transition';

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'inverse';
  className?: string;
}) {
  return (
    <Link href={href} className={`${BTN} ${VARIANT[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Button({
  children,
  variant = 'primary',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'inverse';
  className?: string;
}) {
  return <button className={`${BTN} ${VARIANT[variant]} ${className}`}>{children}</button>;
}

const VARIANT = {
  primary: 'bg-teal-700 text-white hover:bg-teal-600 active:bg-teal-800',
  secondary: 'border-2 border-teal-700 bg-white text-teal-700 hover:bg-teal-50',
  inverse: 'bg-white text-teal-900 hover:bg-teal-50',
} as const;

/** Section heading with the eyebrow / title pairing used throughout. */
export function SectionHead({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: React.ReactNode;
}) {
  return (
    <>
      <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-teal-600">{eyebrow}</p>
      <h2 className="mt-2 max-w-[24ch] text-[30px] leading-[1.15] font-bold tracking-tight text-ink-900">
        {title}
      </h2>
      {lead && <p className="mt-4 max-w-[68ch] text-[17px] leading-relaxed text-ink-700">{lead}</p>}
    </>
  );
}

/** Tag / pill for metadata. */
export function Tag({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'signal' | 'error' | 'warning' | 'success';
}) {
  const tones = {
    neutral: 'bg-ink-50 text-ink-700',
    signal: 'bg-signal-soft text-signal',
    error: 'bg-stop-soft text-stop',
    warning: 'bg-wait-soft text-wait',
    success: 'bg-go-soft text-go',
  } as const;
  return (
    <span className={`rounded-full px-2.5 py-1 text-[12.5px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
