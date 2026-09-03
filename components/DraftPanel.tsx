'use client';

import { useState } from 'react';
import { Icon } from './Icon';

/**
 * The draft, editable before it goes anywhere.
 *
 * A member should be able to change every word of this: it is a letter with
 * their name at the bottom, and the whole value of it is that it is specific to
 * them. Copy and download are the two exits that matter, because the honest
 * ending to this flow is that they file it themselves on the real portal.
 */
export function DraftPanel({
  subject,
  body,
  filename,
  labels,
}: {
  subject: string;
  body: string;
  filename: string;
  labels: Record<string, string>;
}) {
  const [text, setText] = useState(body);
  const [copied, setCopied] = useState(false);
  const t = (k: string) => labels[k] ?? k;

  const full = subject ? `${t('Subject')}: ${subject}\n\n${text}` : text;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const download = () => {
    const blob = new Blob([full], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-3 rounded-sm border border-ink-100 bg-ink-50 p-3.5">
      {subject && (
        <p className="mb-2 text-[13.5px] text-ink-700">
          <span className="font-bold uppercase tracking-[0.06em] text-ink-500">{t('Subject')}: </span>
          {subject}
        </p>
      )}
      <label className="sr-only" htmlFor={`draft-${filename}`}>
        {t('Draft text, editable')}
      </label>
      <textarea
        id={`draft-${filename}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className="h-72 w-full resize-y rounded-sm border border-ink-200 bg-white p-3 font-mono
                   text-[12.5px] leading-relaxed text-ink-900"
      />
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-sm border-2 border-ink-100 bg-white px-3.5 py-2
                     text-[13.5px] font-semibold text-ink-700 transition hover:border-teal-700 hover:text-teal-700"
        >
          <Icon name={copied ? 'check' : 'link'} size={15} aria-hidden />
          {copied ? t('Copied') : t('Copy the text')}
        </button>
        <button
          type="button"
          onClick={download}
          className="inline-flex items-center gap-1.5 rounded-sm border-2 border-ink-100 bg-white px-3.5 py-2
                     text-[13.5px] font-semibold text-ink-700 transition hover:border-teal-700 hover:text-teal-700"
        >
          <Icon name="records" size={15} aria-hidden />
          {t('Download as a text file')}
        </button>
      </div>
    </div>
  );
}
