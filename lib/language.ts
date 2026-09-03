/**
 * Which language to answer in, and whether the person is asking to be shown
 * around rather than told something.
 *
 * Two layers on purpose. Script is decided here and is not negotiable - if
 * somebody writes in Devanagari, no model gets to answer them in English.
 * Romanised Indian languages ("kya ho raha hai") look like Latin text, so that
 * call is left to the model, and this file only checks its answer is a language
 * our speech service can actually pronounce.
 */

/** The languages Sarvam can speak. Anything else falls back to Indian English. */
export const SPOKEN = [
  'en-IN',
  'hi-IN',
  'bn-IN',
  'gu-IN',
  'kn-IN',
  'ml-IN',
  'mr-IN',
  'od-IN',
  'pa-IN',
  'ta-IN',
  'te-IN',
] as const;

export type Spoken = (typeof SPOKEN)[number];

export const LANGUAGE_NAME: Record<Spoken, string> = {
  'en-IN': 'English',
  'hi-IN': 'Hindi',
  'bn-IN': 'Bengali',
  'gu-IN': 'Gujarati',
  'kn-IN': 'Kannada',
  'ml-IN': 'Malayalam',
  'mr-IN': 'Marathi',
  'od-IN': 'Odia',
  'pa-IN': 'Punjabi',
  'ta-IN': 'Tamil',
  'te-IN': 'Telugu',
};

/**
 * What each language calls itself. Shown to the person choosing one - a Kannada
 * speaker looks for ಕನ್ನಡ, not the word "Kannada". This list is exactly what
 * Sarvam can hear and speak, so it never promises a language we cannot answer in.
 */
export const LANGUAGE_NATIVE: Record<Spoken, string> = {
  'en-IN': 'English',
  'hi-IN': 'हिंदी',
  'bn-IN': 'বাংলা',
  'gu-IN': 'ગુજરાતી',
  'kn-IN': 'ಕನ್ನಡ',
  'ml-IN': 'മലയാളം',
  'mr-IN': 'मराठी',
  'od-IN': 'ଓଡ଼ିଆ',
  'pa-IN': 'ਪੰਜਾਬੀ',
  'ta-IN': 'தமிழ்',
  'te-IN': 'తెలుగు',
};

/** The same list as one line of text, for a caption. */
export const LANGUAGE_STRIP = Object.values(LANGUAGE_NATIVE).join(' · ');

const SCRIPTS: [RegExp, Spoken][] = [
  [/[\u0980-\u09FF]/, 'bn-IN'],
  [/[\u0A00-\u0A7F]/, 'pa-IN'],
  [/[\u0A80-\u0AFF]/, 'gu-IN'],
  [/[\u0B00-\u0B7F]/, 'od-IN'],
  [/[\u0B80-\u0BFF]/, 'ta-IN'],
  [/[\u0C00-\u0C7F]/, 'te-IN'],
  [/[\u0C80-\u0CFF]/, 'kn-IN'],
  [/[\u0D00-\u0D7F]/, 'ml-IN'],
  // Devanagari last: Hindi and Marathi share it, and Hindi is the safer default
  [/[\u0900-\u097F]/, 'hi-IN'],
];

/**
 * The script the message is written in, if it is written in an Indian one.
 * Returns null for Latin text, where the script tells you nothing.
 */
export function scriptLanguage(text: string): Spoken | null {
  for (const [re, lang] of SCRIPTS) if (re.test(text)) return lang;
  return null;
}

/**
 * Telltale words of an Indian language typed in Latin letters.
 *
 * Latin text is treated as English UNLESS it carries one of these markers. That
 * default matters: it is why "will I get my pension" is answered in English
 * instead of being guessed into Kannada. A romanised Hindi or Tamil message
 * ("mera paisa kab milega", "en panam enge") trips a marker and is handed to the
 * model to place among the Indian languages. The list does not need to be
 * exhaustive - a miss falls back to English, which is the safe direction to fail.
 */
const ROMANISED_INDIC =
  /\b(kya|kyu|kyun|kyunki|hai|hain|tha|thi|the|kaise|kaisa|kaisi|kaha|kahan|kab|kaun|kitna|kitne|kitni|mera|meri|mere|mujhe|hume|humein|apna|apni|paisa|paise|nahi|nahin|batao|bataiye|bataye|samjhao|samjha|dikhao|dikhaye|chahiye|kaam|hua|hoga|hogi|milega|milegi|karo|kare|karna|karke|raha|rahi|rahe|gaya|gayi|panam|enge|epdi|eppadi|enna|kaasu|kitta)\b/i;

/**
 * Is this Latin message actually an Indian language, not English?
 *
 * Only meaningful for Latin text - call it after scriptLanguage returns null.
 */
export function romanisedIndic(text: string): boolean {
  return ROMANISED_INDIC.test(text);
}

/** The script each language is written in. Marathi borrows Devanagari from Hindi. */
const RANGE: Partial<Record<Spoken, RegExp>> = {
  ...Object.fromEntries(SCRIPTS.map(([re, lang]) => [lang, re])),
  'mr-IN': /[ऀ-ॿ]/,
};

/**
 * Is this text actually written in that language's script?
 *
 * Used to check the model did as it was told. Asking for Kannada and being
 * handed English is not a rare failure, and it is the one failure the person
 * cannot work around, so it is worth verifying rather than assuming.
 */
export function writtenIn(text: string, lang: Spoken): boolean {
  const re = RANGE[lang];
  return re ? re.test(text) : true;
}

export function isSpoken(x: unknown): x is Spoken {
  return typeof x === 'string' && (SPOKEN as readonly string[]).includes(x);
}

/** Strip spacing and punctuation so "walkmethroughplease" matches "walk me through". */
function squash(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\p{M}]/gu, '');
}

/**
 * Phrases that mean "show me", not "tell me". Matched against the squashed
 * string, so spacing and punctuation cannot break them - a real person typing
 * one-handed on a phone writes "walkmethroughplease".
 */
const TOUR_PHRASES = [
  // English
  'walkmethrough',
  'walkthrough',
  'walkthru',
  'walkmethru',
  'showmearound',
  'showmeeverything',
  'showmeeachthing',
  'showmewhateach',
  'showmewhatthis',
  'givemeatour',
  'takemeonatour',
  'guidedtour',
  'tourplease',
  'startthetour',
  'guideme',
  // loose on purpose: "what the hell is happening" wedges words into the middle
  'ishappening',
  'shappening',
  'isgoingon',
  'sgoingon',
  'whatisallthis',
  'whatsallthis',
  'whatisthisabout',
  'whatisitallabout',
  'whatsthisallabout',
  'explaineverything',
  'explaineachthing',
  'explainthewholething',
  'explaineachsection',
  'explainmyepf',
  'iamlost',
  'imlost',
  'idontunderstandanything',
  // Hindi and other Indian languages, in their own script.
  // Deliberately compound rather than single words: "समझाओ" on its own is just
  // "explain", and "मेरा दावा समझाओ" is a question, not a request for a tour.
  'क्याहोरहा',
  'क्याचलरहा',
  'सबदिखाओ',
  'सबकुछदिखाओ',
  'पूरादिखाओ',
  'वेबसाइटदिखाओ',
  'सबसमझाओ',
  'सबकुछसमझाओ',
  'पूरासमझाओ',
  'सबबताओ',
  'घुमाओ',
  'என்னநடக்கிறது',
  'எல்லாத்தையும்காட்டு',
  // romanised
  'kyahoraha',
  'kyachalraha',
  'sabdikhao',
  'sabkuchdikhao',
  'sabsamjhao',
  'sabkuchsamjhao',
  'sabbatao',
  'ghumao',
];

/** Does this message ask to be walked through the product? */
export function wantsTour(text: string): boolean {
  const s = squash(text);
  return TOUR_PHRASES.some((p) => s.includes(p));
}
