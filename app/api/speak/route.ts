import { NextResponse } from 'next/server';

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
 * Sample rate is not the lever it looks like — Sarvam already defaults to 22050Hz.
 */
export async function POST(req: Request) {
  const { text, language = 'en-IN' } = (await req.json()) as {
    text: string;
    language?: string;
  };
  if (!text?.trim()) return NextResponse.json({ error: 'empty' }, { status: 400 });

  const res = await fetch(`${process.env.SARVAM_BASE_URL}/text-to-speech`, {
    method: 'POST',
    headers: {
      'api-subscription-key': process.env.SARVAM_API_KEY ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // no reason to send an essay to a text-to-speech endpoint
      text: text.slice(0, 800),
      target_language_code: language,
      model: process.env.SARVAM_TTS_MODEL,
      // voice and fidelity are configuration, so swapping either is an env change
      speaker: process.env.SARVAM_TTS_SPEAKER,
      speech_sample_rate: Number(process.env.SARVAM_TTS_SAMPLE_RATE ?? 24000),
    }),
  });

  if (!res.ok) {
    // the browser falls back to its own speech synthesis
    return NextResponse.json({ error: await res.text() }, { status: 502 });
  }

  const json = (await res.json()) as { audios?: string[] };
  return NextResponse.json({ audio: json.audios?.[0] ?? null });
}
