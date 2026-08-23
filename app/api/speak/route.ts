import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Sarvam Bulbul for speech. Kept server-side so the API key never reaches the
 * browser. Returns base64 wav chunks exactly as Sarvam does.
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
      text: text.slice(0, 1400),
      target_language_code: language,
      model: process.env.SARVAM_TTS_MODEL,
    }),
  });

  if (!res.ok) {
    // the browser falls back to its own speech synthesis
    return NextResponse.json({ error: await res.text() }, { status: 502 });
  }

  const json = (await res.json()) as { audios?: string[] };
  return NextResponse.json({ audio: json.audios?.[0] ?? null });
}
