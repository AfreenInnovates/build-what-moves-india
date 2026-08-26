/**
 * The parts of the language layer a browser is allowed to see.
 *
 * Kept apart from the dictionaries and the cookie reader, which are server-only:
 * the switcher runs on the client and needs the list of languages, but nothing
 * on the client should pull in every translation of the whole site.
 */
export const LANGS = {
  en: { label: 'English', native: 'English' },
  hi: { label: 'Hindi', native: 'हिंदी' },
  kn: { label: 'Kannada', native: 'ಕನ್ನಡ' },
} as const;

export type Lang = keyof typeof LANGS;

export const LANG_COOKIE = 'lang';

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && v in LANGS;
}
