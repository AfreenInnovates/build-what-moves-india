import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isLang, LANG_COOKIE } from '@/lib/i18n/langs';
import { readJson } from '@/lib/guard';

export const runtime = 'nodejs';

/** Set the display language. A cookie, so every server render sees it. */
export async function POST(req: Request) {
  const body = await readJson<{ lang?: unknown }>(req);
  const lang = body?.lang;
  if (!isLang(lang)) return NextResponse.json({ error: 'unknown language' }, { status: 400 });

  (await cookies()).set(LANG_COOKIE, lang, {
    // read by the switcher so it can show the current choice without a round trip
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return NextResponse.json({ lang });
}
