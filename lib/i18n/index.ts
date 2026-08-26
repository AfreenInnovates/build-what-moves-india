import 'server-only';
import { cookies } from 'next/headers';
import { LANGS, LANG_COOKIE, isLang, type Lang } from './langs';
import hi from './hi.json';
import kn from './kn.json';

/**
 * Site-wide translation.
 *
 * The dictionaries are keyed by the English string itself rather than by an
 * invented id. That is unusual, and deliberate: this codebase already keeps its
 * copy in data modules (the gate spec, the section list, the process notes), so
 * a key-based scheme would mean inventing several hundred names and threading
 * them through code that currently just reads `gate.title`. Keying on the source
 * text means a component wraps what it already had, and anything without a
 * translation falls back to English instead of rendering a missing-key marker.
 *
 * The cost is that editing an English string orphans its translation. The
 * generator script reports those, so they surface rather than rot silently.
 */
export { LANGS, LANG_COOKIE, isLang, type Lang };

const DICTS: Record<Lang, Record<string, string>> = {
  en: {},
  hi: hi as Record<string, string>,
  kn: kn as Record<string, string>,
};


/** The language this request should render in. */
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : 'en';
}

export type T = (s: string) => string;

/** A translator for one language. Unknown strings come back untouched. */
export function translator(lang: Lang): T {
  if (lang === 'en') return (s) => s;
  const dict = DICTS[lang];
  return (s) => dict[s] ?? s;
}

/** The usual entry point in a server component: `const t = await getT()`. */
export async function getT(): Promise<T> {
  return translator(await getLang());
}
