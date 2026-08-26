/**
 * How far through the claim you are, as a ring.
 *
 * A flat row of segments told you how many steps were done but nothing about
 * how close that was to finished - six thin bars read as decoration. A ring
 * fills, which is the one shape everybody already reads as progress, and it puts
 * the number that matters in the middle where the eye lands first.
 *
 * Inline SVG on purpose. The obvious move is a chart library, but every one of
 * them wants shadcn's token names and its own config, and this project already
 * has a colour system that works. Twenty lines here costs nothing at runtime,
 * inherits the theme, and cannot break anything else.
 */
export function ProgressRing({
  done,
  total,
  label,
  sublabel,
  size = 108,
}: {
  done: number;
  total: number;
  /** the big number in the middle */
  label: string;
  /** the small line under it */
  sublabel: string;
  size?: number;
}) {
  const pct = total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const complete = done >= total && total > 0;

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          {/* the track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-ink-100)"
            strokeWidth={stroke}
          />
          {/* what is done, drawn from the top clockwise */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={complete ? 'var(--color-go)' : 'var(--color-signal)'}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.2,0.7,0.2,1)' }}
          />
        </svg>

        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`tabular text-[26px] leading-none font-bold ${
              complete ? 'text-go' : 'text-signal'
            }`}
          >
            {label}
          </span>
          <span className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-ink-500">
            {sublabel}
          </span>
        </span>
      </div>

      <div className="min-w-0">
        <p className="tabular text-[15px] font-bold text-ink-900">
          {done} / {total}
        </p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className={`h-full rounded-full ${complete ? 'bg-go' : 'bg-signal'}`}
            style={{ width: `${pct * 100}%`, transition: 'width 700ms cubic-bezier(0.2,0.7,0.2,1)' }}
          />
        </div>
      </div>
    </div>
  );
}
