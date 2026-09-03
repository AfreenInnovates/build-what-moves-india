import type { Schedule } from '@/lib/schedule';
import { fill } from '@/lib/insights';

type T = (s: string) => string;

const LANE_H = 44;

/**
 * The schedule, drawn.
 *
 * The engine's hardest piece of work is the critical path, and until now the
 * dashboard rendered it as a sentence saying it existed. This is the picture:
 * one solid chain across the top whose length IS the wait, and everything else
 * underneath it, visibly finishing early and visibly costing nothing.
 *
 * Laid out with percentage widths rather than SVG so the labels are real text -
 * they translate, they wrap, and they are readable by a screen reader without a
 * parallel description to maintain.
 */
export function CriticalPathTimeline({
  data,
  t = (s: string) => s,
}: {
  data: Schedule;
  t?: T;
}) {
  const { bars, span, baselineDays, totalDays, laneCount } = data;
  if (span <= 0) return null;

  const pct = (v: number) => `${(v / span) * 100}%`;
  const dayWord = (n: number) => (n === 1 ? t('day') : t('days'));

  const chain = bars.filter((b) => b.gate.onCriticalPath);
  const slack = bars.filter((b) => !b.gate.onCriticalPath);

  return (
    <section
      className="rounded-md border border-ink-100 bg-white p-5"
      data-tour="timeline"
      aria-label={t('What actually decides your date')}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[19px] font-bold text-ink-900">
          {t('What actually decides your date')}
        </h2>
        <span className="tabular text-[13px] font-semibold text-ink-500">
          {fill(t('{n} working days of waiting'), { n: String(span) })}
        </span>
      </div>

      <p className="mt-1.5 max-w-[62ch] text-[15px] leading-relaxed text-ink-600">
        {t(
          'The steps on the orange line have to happen one after another, so their total is your wait. Everything below it runs alongside - those still need doing, they just do not add days.',
        )}
      </p>

      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="relative" style={{ height: laneCount * LANE_H }}>
            {/* day gridlines, one per quarter of the span */}
            {[0.25, 0.5, 0.75].map((f) => (
              <span
                key={f}
                aria-hidden
                className="absolute top-0 bottom-0 w-px bg-ink-100"
                style={{ left: `${f * 100}%` }}
              />
            ))}

            {bars.map((b) => {
              const critical = b.gate.onCriticalPath;
              return (
                <div
                  key={b.gate.id}
                  className="absolute flex items-center"
                  style={{
                    left: pct(b.start),
                    width: `max(72px, ${pct(b.gate.latencyDays)})`,
                    top: b.lane * LANE_H,
                    height: LANE_H - 8,
                  }}
                >
                  <div
                    className={`flex h-full w-full min-w-0 items-center gap-2 rounded-sm px-2.5 ${
                      critical
                        ? 'bg-signal-soft ring-1 ring-signal/45'
                        : 'border border-dashed border-ink-200 bg-ink-50'
                    }`}
                  >
                    <span
                      className={`min-w-0 flex-1 truncate text-[13.5px] font-semibold ${
                        critical ? 'text-signal' : 'text-ink-500'
                      }`}
                    >
                      {t(b.gate.title)}
                    </span>
                    <span
                      className={`tabular shrink-0 text-[12px] font-bold ${
                        critical ? 'text-signal' : 'text-ink-400'
                      }`}
                    >
                      {b.gate.latencyDays === 0 ? t('mins') : `${b.gate.latencyDays}d`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="tabular mt-1 flex justify-between border-t border-ink-100 pt-1.5 text-[12px] text-ink-400">
            <span>{t('today')}</span>
            <span>
              {t('day')} {span}
            </span>
          </div>
        </div>
      </div>

      {/* legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
        <span className="flex items-center gap-2">
          <span className="h-3 w-5 rounded-xs bg-signal-soft ring-1 ring-signal/45" aria-hidden />
          <span className="font-semibold text-signal">
            {fill(t('this chain is your {n} days'), { n: String(span) })}
          </span>
        </span>
        {slack.length > 0 && (
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-5 rounded-xs border border-dashed border-ink-200 bg-ink-50"
              aria-hidden
            />
            <span className="text-ink-500">{t('costs you no extra time')}</span>
          </span>
        )}
      </div>

      <p className="tabular mt-4 border-t border-ink-100 pt-3.5 text-[14.5px] text-ink-700">
        {span} {dayWord(span)} {t('of waiting')} + {baselineDays} {dayWord(baselineDays)}{' '}
        {t('for EPFO to settle')} ={' '}
        <span className="font-bold text-ink-900">
          {totalDays} {t('working days')}
        </span>
      </p>

      {/* the same thing in words, for anyone not reading the picture */}
      <p className="sr-only">
        {chain.length > 0 &&
          fill(t('On the critical chain: {list}.'), {
            list: chain.map((b) => `${t(b.gate.title)} (${b.gate.latencyDays})`).join(', '),
          })}{' '}
        {slack.length > 0 &&
          fill(t('Running alongside, costing no extra days: {list}.'), {
            list: slack.map((b) => t(b.gate.title)).join(', '),
          })}
      </p>
    </section>
  );
}
