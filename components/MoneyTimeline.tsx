import type { ContributionTimeline } from '@/lib/insights';
import { inr } from '@/lib/insights';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * How the balance built up, month by month. An area chart climbing left to
 * right, flat where there was a gap in contributions - so a break in your record
 * is something you can see, not just read about.
 */
export function MoneyTimeline({ data }: { data: ContributionTimeline }) {
  const { points, yearTicks, total } = data;
  if (points.length < 2) return null;

  const W = 720;
  const H = 240;
  const padL = 8;
  const padR = 8;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const n = points.length - 1;
  const x = (i: number) => padL + (i / n) * innerW;
  const y = (v: number) => padT + innerH - (v / total) * innerH;

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.cumulative).toFixed(1)}`).join(' ');
  const area = `${line} L${x(n).toFixed(1)},${(padT + innerH).toFixed(1)} L${padL},${(padT + innerH).toFixed(1)} Z`;

  // shade the months that had no contributions (gaps)
  const gapBands: { x1: number; x2: number }[] = [];
  let gapStart = -1;
  points.forEach((p, i) => {
    if (!p.employer && gapStart === -1) gapStart = i;
    if (p.employer && gapStart !== -1) {
      gapBands.push({ x1: x(gapStart), x2: x(i) });
      gapStart = -1;
    }
  });

  const recent = points.slice(-6).reverse();

  return (
    <section className="rounded-xl border border-ink-100 bg-white p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[16px] font-bold text-ink-900">How it built up</h2>
        <span className="tabular text-[13px] font-semibold text-ink-500">
          {points[0].year} to {points.at(-1)!.year}
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[520px]" role="img" aria-label="Balance growth over time">
          <defs>
            <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-teal-500)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-teal-500)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* horizontal guides */}
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1={padL}
              x2={W - padR}
              y1={y(total * f)}
              y2={y(total * f)}
              stroke="var(--color-ink-100)"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
          ))}

          {/* gap bands */}
          {gapBands.map((g, i) => (
            <rect key={i} x={g.x1} y={padT} width={g.x2 - g.x1} height={innerH} fill="var(--color-wait-soft)" opacity="0.7" />
          ))}

          <path d={area} fill="url(#fill)" />
          <path d={line} fill="none" stroke="var(--color-teal-600)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

          {/* end dot */}
          <circle cx={x(n)} cy={y(points.at(-1)!.cumulative)} r="4.5" fill="var(--color-teal-700)" stroke="#fff" strokeWidth="2" />

          {/* year ticks */}
          {yearTicks.map((t) => (
            <text key={t.year} x={x(t.at)} y={H - 8} fontSize="11" fill="var(--color-ink-400)" textAnchor="middle">
              {t.year}
            </text>
          ))}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-xs bg-teal-500/40" /> balance climbing
        </span>
        {data.points.some((p) => !p.employer) && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-xs bg-wait-soft" /> gap - no contributions
          </span>
        )}
        <span className="ml-auto tabular font-semibold text-ink-700">Now: {inr(total)}</span>
      </div>

      {/* recent months, plainly listed */}
      <div className="mt-5">
        <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink-500">Recent months</p>
        <ul className="mt-2 divide-y divide-ink-100">
          {recent.map((p) => (
            <li key={p.key} className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
              <span className="tabular w-24 shrink-0 text-ink-500">
                {MONTHS[p.month - 1]} {p.year}
              </span>
              <span className="min-w-0 flex-1 truncate text-ink-700">
                {p.employer ?? <span className="text-wait">gap - no contribution</span>}
              </span>
              <span className={`tabular shrink-0 font-semibold ${p.added > 0 ? 'text-go' : 'text-ink-300'}`}>
                {p.added > 0 ? `+${inr(p.added)}` : '-'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
