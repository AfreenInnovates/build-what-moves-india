'use client';

import { useState } from 'react';
import { sendEmployerRequest } from '@/app/actions';
import { Icon } from './Icon';

type Status = 'none' | 'pending' | 'viewed' | 'done';

/**
 * Sending the request, and then being able to see where it got to.
 *
 * The worst part of waiting on somebody else is not knowing whether anyone
 * looked. So this does not just hand over a link and forget: once sent, the
 * state is kept, and the member can see when the employer opened it and when
 * they acted. That is the whole difference between a request and a void.
 */
export function SendToEmployer({
  gateId,
  link,
  status,
  viewedAt,
  labels,
}: {
  gateId: string;
  link: string;
  status: Status;
  viewedAt: string | null;
  labels: Record<string, string>;
}) {
  const t = (k: string) => labels[k] ?? k;
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the link is on screen to copy by hand */
    }
  };

  const send = async () => {
    if (sending) return;
    setSending(true);
    const fd = new FormData();
    fd.set('gateId', gateId);
    // a short beat so the send reads as an action, not a flicker
    await new Promise((r) => setTimeout(r, 1400));
    await sendEmployerRequest(fd);
    setSending(false);
  };

  if (status === 'done') {
    return (
      <div className="mt-4 rounded-md border-2 border-go bg-go-soft px-4 py-3.5">
        <p className="flex items-center gap-2 text-[14.5px] font-bold text-go">
          <Icon name="check" size={17} aria-hidden />
          {t('Your employer has done this')}
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-800">
          {t('They opened your request and marked it complete. This step is no longer holding up your claim.')}
        </p>
      </div>
    );
  }

  if (status === 'pending' || status === 'viewed') {
    const opened = status === 'viewed';
    return (
      <div
        className={`mt-4 rounded-md border-2 px-4 py-3.5 ${
          opened ? 'border-wait bg-wait-soft' : 'border-ink-100 bg-ink-50'
        }`}
      >
        <p
          className={`flex items-center gap-2 text-[14.5px] font-bold ${
            opened ? 'text-wait' : 'text-ink-700'
          }`}
        >
          <Icon name={opened ? 'eye' : 'employer'} size={17} aria-hidden />
          {opened ? t('Your employer has opened this') : t('Sent. Waiting on your employer')}
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-800">
          {opened
            ? t('Somebody at your old company has looked at your request. It has not been marked done yet.')
            : t('The request is sitting with your old company. You will see here the moment somebody opens it.')}
          {viewedAt && opened ? ` (${viewedAt})` : ''}
        </p>

        <div className="mt-3">
          <button
            onClick={() => copy(link)}
            className="rounded-md border-2 border-teal-700 bg-white px-3.5 py-2 text-[13.5px] font-bold text-teal-700 hover:bg-teal-50"
          >
            {copied ? t('Copied') : t('Copy the link again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button
        onClick={send}
        disabled={sending}
        className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2.5 text-[14px] font-bold text-white transition hover:bg-teal-600 disabled:opacity-60"
      >
        {sending && (
          <svg className="animate-spin" width="15" height="15" viewBox="0 0 20 20" aria-hidden>
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
        {sending ? t('Sending') : t('Send this to my employer')}
      </button>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
        {t('This creates a link that opens onto the one thing they have to do, with your details already filled in. You choose who to send it to.')}
      </p>
    </div>
  );
}
