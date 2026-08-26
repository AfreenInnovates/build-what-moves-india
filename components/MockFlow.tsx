'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EpfoField } from '@/lib/epfo-screens';
import type { MockApp } from '@/lib/mock-apps';
import { Icon } from './Icon';

type Stage = 'idle' | 'working' | 'done';

/**
 * A step you can actually complete, instead of a picture of one.
 *
 * The fields are the real ones, in the real order, with the real wording. What
 * is different is that this one runs: fill it in, submit it, watch the wait, and
 * the gate behind it clears. Nothing leaves the browser except the single call
 * that marks the gate done in our own database.
 *
 * "Fill in demo details" exists because nobody demonstrating this should have to
 * type a date of birth into eleven fields, and because the values that matter -
 * the ones that differ across records - are the point being made.
 */
export function MockFlow({
  app,
  title,
  fields,
  prefills,
  gateId,
  afterSubmit,
  demo,
  onComplete,
  completed,
  labels,
}: {
  app: MockApp;
  title: string;
  fields: EpfoField[];
  prefills: Partial<Record<NonNullable<EpfoField['prefill']>, string>>;
  gateId: string;
  afterSubmit: string;
  /** what "fill in demo details" puts in each field, by label */
  demo: Record<string, string>;
  /** called once the gate has been cleared on the server */
  onComplete: (gateId: string) => Promise<void>;
  /** the gate was already cleared before this page was opened */
  completed?: boolean;
  labels: Record<string, string>;
}) {
  const t = (k: string) => labels[k] ?? k;
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [filled, setFilled] = useState(false);
  /**
   * A step that is already done opens on its confirmation, not on a blank form.
   *
   * Coming back to a finished step and being asked to fill it in again reads as
   * if the work was lost. The tick is the record that it happened, so it stays.
   */
  const [stage, setStage] = useState<Stage>(completed ? 'done' : 'idle');

  /**
   * Fill every field, and be certain about the required ones.
   *
   * Leaving a required field empty leaves the submit button disabled, which is
   * correct behaviour and was invisible in a demo - the automated run pressed a
   * button that could never fire and went round the same step forever. So
   * anything required and still empty gets something valid for its kind rather
   * than nothing.
   */
  const fill = () => {
    const next: Record<string, string> = {};
    for (const f of fields) {
      if (f.kind === 'readonly') continue;
      const fromRecord = f.prefill ? prefills[f.prefill] : undefined;
      let v = demo[f.label] ?? fromRecord ?? '';
      if (!v && f.required) {
        if (f.kind === 'checkbox') v = 'yes';
        else if (f.kind === 'select' || f.kind === 'radio') v = f.options?.[0] ?? 'Yes';
        else if (f.kind === 'date') v = '2024-01-01';
        else if (f.kind === 'otp') v = '000000';
        else v = 'Demo value';
      }
      next[f.label] = v;
    }
    setValues(next);
    setFilled(true);
  };

  const submit = async () => {
    if (stage !== 'idle') return;
    setStage('working');
    // a beat, so the wait is visible rather than instant - this is a real queue
    // in the live system, and pretending it is instant would be its own lie
    await new Promise((r) => setTimeout(r, 2000));
    await onComplete(gateId);
    setStage('done');
    router.refresh();
  };

  const missing = fields.filter(
    (f) => f.required && f.kind !== 'readonly' && !(values[f.label] ?? '').trim(),
  ).length;

  return (
    <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-[0_2px_10px_rgba(16,20,24,0.06)]">
      <div className={`${app.bar} px-5 py-3.5`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
          {t('A working rebuild, not the real app')}
        </p>
        <p className="mt-0.5 text-[16px] font-bold text-white">{t(app.name)}</p>
        <p className="text-[12px] text-white/70">{t(app.tagline)}</p>
      </div>

      <div className="border-b border-ink-100 bg-ink-50 px-5 py-3">
        <p className="text-[15px] font-bold text-ink-900">{title}</p>
      </div>

      {stage === 'done' ? (
        <div className="px-5 py-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-go-soft text-go">
            <Icon name="check" size={30} aria-hidden />
          </span>
          <p className="mt-4 text-[18px] font-bold text-ink-900">{t(app.done)}</p>
          <p className="mx-auto mt-2 max-w-[46ch] text-[14.5px] leading-relaxed text-ink-700">
            {t(afterSubmit)}
          </p>
          <p className="mt-4 text-[14px] font-semibold text-teal-700">
            {t('This step is now marked done on your claim.')}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-3">
            <p className="text-[13.5px] text-ink-600">
              {filled ? t('Demo details filled in.') : t('Nothing here is your real data.')}
            </p>
            <button
              onClick={fill}
              disabled={stage !== 'idle'}
              className="inline-flex items-center gap-1.5 rounded-md border-2 border-teal-700 bg-white px-3.5 py-2 text-[13.5px] font-bold text-teal-700 transition hover:bg-teal-50 disabled:opacity-50"
            >
              <Icon name="bolt" size={14} aria-hidden />
              {t('Fill in demo details')}
            </button>
          </div>

          <div className="space-y-4 px-5 py-5">
            {fields.map((f) => (
              <label key={f.label} className="block">
                <span className="text-[13.5px] font-semibold text-ink-800">
                  {t(f.label)}
                  {f.required && <span className="ml-1 text-stop">*</span>}
                </span>

                {f.kind === 'readonly' ? (
                  <p className="mt-1 rounded-xs border border-ink-200 bg-ink-50 px-3 py-2 text-[14px] text-ink-600">
                    {(f.prefill && prefills[f.prefill]) || '-'}
                  </p>
                ) : f.kind === 'select' ? (
                  <select
                    value={values[f.label] ?? ''}
                    onChange={(e) => setValues({ ...values, [f.label]: e.target.value })}
                    disabled={stage !== 'idle'}
                    className="mt-1 w-full rounded-xs border border-ink-300 bg-white px-3 py-2 text-[14px] text-ink-800"
                  >
                    <option value="">{t('Select')}</option>
                    {(f.options ?? []).map((o) => (
                      <option key={o} value={o}>
                        {t(o)}
                      </option>
                    ))}
                  </select>
                ) : f.kind === 'checkbox' ? (
                  <span className="mt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(values[f.label])}
                      onChange={(e) =>
                        setValues({ ...values, [f.label]: e.target.checked ? 'yes' : '' })
                      }
                      disabled={stage !== 'idle'}
                      className="h-4 w-4"
                    />
                    <span className="text-[14px] text-ink-700">{t('I agree')}</span>
                  </span>
                ) : (
                  <input
                    type={f.kind === 'date' ? 'date' : 'text'}
                    value={values[f.label] ?? ''}
                    placeholder={f.placeholder}
                    onChange={(e) => setValues({ ...values, [f.label]: e.target.value })}
                    disabled={stage !== 'idle'}
                    className="mt-1 w-full rounded-xs border border-ink-300 bg-white px-3 py-2 text-[14px] text-ink-800"
                  />
                )}

                {f.note && (
                  <span className="mt-1 flex gap-1.5 text-[12.5px] leading-relaxed text-ink-500">
                    <span className="shrink-0 font-bold text-wait">{t('In reality:')}</span>
                    <span>{t(f.note)}</span>
                  </span>
                )}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-ink-100 bg-ink-50 px-5 py-4">
            <button
              onClick={submit}
              disabled={stage !== 'idle' || missing > 0}
              className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-5 py-2.5 text-[14.5px] font-bold text-white transition hover:bg-teal-600 disabled:opacity-50"
            >
              {stage === 'working' && (
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 20 20" aria-hidden>
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray="38"
                    strokeDashoffset="12"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {stage === 'working' ? t(app.working) : t(app.submit)}
            </button>
            {missing > 0 && (
              <span className="text-[13.5px] text-ink-500">
                {t('Fill the required fields, or use the button above.')}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
