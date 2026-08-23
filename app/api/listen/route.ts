import { NextResponse } from 'next/server';
import { caseIdFromCookie, withinLimit } from '@/lib/guard';

export const runtime = 'nodejs';

/**
 * Sarvam Saarika for the authoritative transcript.
 *
 * Note the audio arrives as WAV, not webm. MediaRecorder produces
 * `audio/webm;codecs=opus` in Chrome and Sarvam rejects it outright, so the
 * client captures raw PCM through the Web Audio API and encodes a WAV instead.
 *
 * The browser's own speech engine runs alongside this and is what produces the
 * live word-by-word feedback — it cannot be replaced, because Sarvam's API is
 * batch and only answers once you stop talking. But the browser engine is weak
 * on Indian names, Indic scripts and code-mixed speech, which is most of what
 * gets said here. So the browser drives the live display, and Sarvam produces
 * the text that is actually sent.
 */
export async function POST(req: Request) {
  const caseId = await caseIdFromCookie();
  if (!caseId) return NextResponse.json({ error: 'not signed in' }, { status: 401 });
  if (!withinLimit(`listen:${caseId}`, 30, 60_000)) {
    return NextResponse.json({ error: 'too many requests' }, { status: 429 });
  }

  const form = await req.formData();
  const file = form.get('audio');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'no audio' }, { status: 400 });
  }
  // 16kHz mono WAV: a minute of speech is about 2MB
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'audio too large' }, { status: 413 });
  }

  const out = new FormData();
  out.append('file', file, 'speech.wav');
  out.append('model', process.env.SARVAM_ASR_MODEL ?? 'saarika:v2.5');
  const requested = String(form.get('language') ?? 'unknown');
  out.append('language_code', /^([a-z]{2}-[A-Z]{2}|unknown)$/.test(requested) ? requested : 'unknown');

  const res = await fetch(`${process.env.SARVAM_BASE_URL}/speech-to-text`, {
    method: 'POST',
    headers: { 'api-subscription-key': process.env.SARVAM_API_KEY ?? '' },
    body: out,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[listen] sarvam', res.status, detail.slice(0, 200));
    // the caller keeps whatever the browser heard
    return NextResponse.json({ transcript: null }, { status: 200 });
  }

  const j = (await res.json()) as { transcript?: string; language_code?: string };
  return NextResponse.json({ transcript: j.transcript ?? null, language: j.language_code ?? null });
}
