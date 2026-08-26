import { NextResponse } from 'next/server';
import { caseIdFromCookie, withinLimit, tooLarge, readJson } from '@/lib/guard';

export const runtime = 'nodejs';

/**
 * Sarvam Bulbul for speech, server-side so the API key never reaches the browser.
 *
 * Voice and model are env-configured because they trade clarity against latency,
 * and the two model families do not share a speaker list. Median of three runs on
 * one sentence, at 24kHz:
 *   bulbul:v2 / vidya     593ms
 *   bulbul:v2 / anushka   741ms
 *   bulbul:v3 / ritu     1513ms
 *   bulbul:v3 / shreya   3129ms
 * Sample rate is not the lever it looks like - Sarvam already defaults to 22050Hz.
 */
export async function POST(req: Request) {
  const caseId = await caseIdFromCookie();
  if (!caseId) return NextResponse.json({ error: 'not signed in' }, { status: 401 });
  if (!withinLimit(`speak:${caseId}`, 40, 60_000)) {
    return NextResponse.json({ error: 'too many requests' }, { status: 429 });
  }

  const body = await readJson<{ text?: unknown; language?: unknown }>(req);
  const text = typeof body?.text === 'string' ? body.text : '';
  const language = typeof body?.language === 'string' ? body.language : 'en-IN';
  if (!text.trim()) return NextResponse.json({ error: 'empty' }, { status: 400 });
  if (tooLarge(text, 4000)) return NextResponse.json({ error: 'too long' }, { status: 413 });
  // only the language tags we actually use; never pass user input straight through
  const lang = /^[a-z]{2}-[A-Z]{2}$/.test(language) ? language : 'en-IN';

  const res = await fetch(`${process.env.SARVAM_BASE_URL}/text-to-speech`, {
    method: 'POST',
    headers: {
      'api-subscription-key': process.env.SARVAM_API_KEY ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // no reason to send an essay to a text-to-speech endpoint
      text: text.slice(0, 800),
      target_language_code: lang,
      model: process.env.SARVAM_TTS_MODEL,
      // voice and fidelity are configuration, so swapping either is an env change
      speaker: process.env.SARVAM_TTS_SPEAKER,
      speech_sample_rate: Number(process.env.SARVAM_TTS_SAMPLE_RATE ?? 24000),
    }),
  });

  if (!res.ok) {
    // log the upstream detail; never hand it to the browser
    console.error('[speak] sarvam', res.status, (await res.text().catch(() => '')).slice(0, 200));
    // the browser falls back to its own speech synthesis
    return NextResponse.json({ audio: null, error: 'speech unavailable' }, { status: 502 });
  }

  const json = (await res.json()) as { audios?: string[] };
  return NextResponse.json({ audio: json.audios?.[0] ?? null });
}
