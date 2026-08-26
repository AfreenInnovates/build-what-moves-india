import type { EpfoField, EpfoScreen as Screen } from '@/lib/epfo-screens';

/**
 * A faithful reproduction of the real EPFO screen, deliberately styled to look
 * like the portal rather than like us - so anyone who has used it recognises
 * where they are. Every control is inert, and every place we substitute
 * something carries the note saying so.
 */
export function EpfoScreenPreview({
  t,
  screen,
  prefills,
}: {
  /** annotations are ours, so they translate; the reproduced form does not */
  t?: (s: string) => string;
  screen: Screen;
  prefills: Partial<Record<NonNullable<EpfoField['prefill']>, string>>;
}) {
  const tr = t ?? ((x: string) => x);
  return (
    <div className="overflow-hidden rounded-md border-2 border-ink-100">
      {/* honesty banner, above the reproduction so it is read first */}
      <div className="flex items-start gap-2.5 border-b-2 border-ink-100 bg-wait-soft px-4 py-3">
        <svg width="18" height="18" viewBox="0 0 20 20" className="mt-0.5 shrink-0" aria-hidden>
          <circle cx="10" cy="10" r="9" fill="var(--color-wait)" />
          <path d="M10 5v6M10 13.5v1" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p className="text-[13.5px] leading-relaxed text-ink-800">
          <span className="font-bold text-wait">{tr('This is the real EPFO screen, rebuilt.')}</span> Every
          field below is what the portal actually asks you for. Nothing here submits anywhere, no
          OTP is sent, and no document leaves your machine. Notes marked{' '}
          <span className="font-semibold">{tr('In reality')}</span> {tr('say what the live system does at that step.')}
        </p>
      </div>

      {/* portal chrome, in EPFO's own colour rather than ours */}
      <div className="bg-[#055160] px-4 py-2.5">
        <p className="font-mono text-[11px] text-teal-100">{screen.breadcrumb}</p>
        <p className="mt-0.5 text-[15px] font-semibold text-white">{screen.screenTitle}</p>
      </div>

      <div className="bg-white px-4 py-5 sm:px-5">
        {screen.intro && (
          <p className="mb-5 border-l-4 border-ink-100 pl-3.5 text-[14px] leading-relaxed text-ink-700">
            {screen.intro}
          </p>
        )}

        <div className="space-y-4">
          {screen.fields.map((f) => (
            <Field key={f.label} f={f} prefills={prefills} t={tr} />
          ))}
        </div>

        <button
          type="button"
          disabled
          className="mt-6 cursor-not-allowed rounded-sm bg-[#055160]/45 px-6 py-2.5 text-[14.5px] font-semibold text-white"
        >
          {screen.submit}
        </button>
        <p className="mt-1.5 text-[12px] text-ink-400">{tr('Disabled - this reproduction submits nothing.')}</p>
      </div>

      <div className="border-t-2 border-ink-100 bg-ink-50 px-4 py-4 sm:px-5">
        <p className="text-[12.5px] font-bold uppercase tracking-[0.08em] text-ink-500">
          {tr('What happens next, on the real portal')}
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-800">{screen.afterSubmit}</p>
        {screen.afterWait && (
          <p className="mt-2 text-[14px] leading-relaxed text-stop">{screen.afterWait}</p>
        )}
      </div>
    </div>
  );
}

function Field({
  f,
  prefills,
  t,
}: {
  f: EpfoField;
  prefills: Partial<Record<NonNullable<EpfoField['prefill']>, string>>;
  t: (s: string) => string;
}) {
  const value = f.prefill ? prefills[f.prefill] : undefined;
  const base =
    'w-full rounded-xs border border-ink-300 bg-ink-50 px-3 py-2 text-[14px] text-ink-700 cursor-not-allowed';

  return (
    <div>
      <label className="block text-[13.5px] font-semibold text-ink-800">
        {f.label}
        {f.required && <span className="ml-1 text-stop">*</span>}
      </label>

      <div className="mt-1.5">
        {f.kind === 'select' && (
          <select disabled className={base} aria-label={f.label}>
            {(f.options ?? []).map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        )}

        {f.kind === 'radio' && (
          <div className="flex flex-wrap gap-4 pt-0.5">
            {(f.options ?? []).map((o) => (
              <span key={o} className="flex items-center gap-1.5 text-[14px] text-ink-700">
                <span className="h-4 w-4 rounded-full border-2 border-ink-300 bg-ink-50" />
                {o}
              </span>
            ))}
          </div>
        )}

        {f.kind === 'checkbox' && (
          <span className="flex items-center gap-2 text-[14px] text-ink-700">
            <span className="h-4 w-4 rounded-xs border-2 border-ink-300 bg-ink-50" />
            {t('Not ticked in this reproduction')}
          </span>
        )}

        {f.kind === 'otp' && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className="h-9 w-8 rounded-xs border border-ink-300 bg-ink-50"
                  aria-hidden
                />
              ))}
            </div>
            <span className="rounded-xs border border-ink-300 px-2.5 py-1.5 text-[12.5px] text-ink-400">
              {t('Get OTP')}
            </span>
          </div>
        )}

        {f.kind === 'file' && (
          <div className="flex items-center gap-3 rounded-xs border border-dashed border-ink-300 bg-ink-50 px-3 py-3">
            <span className="rounded-xs border border-ink-300 bg-white px-2.5 py-1 text-[12.5px] text-ink-500">
              {t('Choose file')}
            </span>
            <span className="text-[13px] text-ink-400">{t('No file selected')}</span>
          </div>
        )}

        {f.kind === 'readonly' && (
          <p className="rounded-xs bg-ink-50 px-3 py-2 text-[14px] text-ink-700">
            {value ?? '-'}
          </p>
        )}

        {(f.kind === 'text' || f.kind === 'date') && (
          <input
            disabled
            type="text"
            className={base}
            defaultValue={value ?? ''}
            placeholder={f.placeholder ?? (f.kind === 'date' ? 'DD/MM/YYYY' : '')}
            aria-label={f.label}
          />
        )}
      </div>

      {f.note && (
        <p className="mt-1.5 flex gap-1.5 text-[12.5px] leading-relaxed text-ink-500">
          <span className="shrink-0 font-bold text-wait">{t('In reality:')}</span>
          <span>{t(f.note)}</span>
        </p>
      )}
    </div>
  );
}
