import { SECTIONS } from './sections';

/**
 * Where the guided tour can point.
 *
 * The tour used to only know about gates, which meant "walk me through" lit up
 * three rows on one page and called that the tour of a nine-section product.
 * These targets cover the whole site, and each one carries the page it lives on
 * so the tour can navigate there before it highlights anything.
 */
export interface TourTarget {
  id: string;
  /** shown as the bubble's heading */
  label: string;
  /** the page this target lives on; the tour routes here first */
  href: string;
  /** what to ring, once that page is up */
  selector: string;
  /** narration if the language service is unreachable */
  say: string;
  /** the same, in Hindi */
  hi: string;
}

const SITE: TourTarget[] = [
  {
    id: 'overview',
    label: 'Your claim in one sentence',
    href: '/dashboard',
    selector: '[data-tour="overview"]',
    say: 'This is your whole claim in one sentence: which jobs you are claiming the money from, and where it starts and ends.',
    hi: 'यह आपका पूरा दावा एक वाक्य में है - किन नौकरियों का पैसा आप निकाल रहे हैं, और वह कहाँ से कहाँ तक है।',
  },
  {
    id: 'countdown',
    label: 'Working days away',
    href: '/dashboard',
    selector: '[data-tour="countdown"]',
    say: 'This is the honest number of working days until your money can reach you. It only counts the steps that actually hold you up, not every step.',
    hi: 'यह ईमानदार गिनती है कि आपके पैसे आने में कितने कार्यदिवस बाकी हैं। इसमें सिर्फ़ वही कदम गिने जाते हैं जो असल में देरी करा रहे हैं।',
  },
  {
    id: 'gates',
    label: 'Ready to file?',
    href: '/dashboard',
    selector: '[data-tour="gates"]',
    say: 'Seven conditions have to be true before EPFO will pay. You are seeing all seven at once here, instead of finding out one rejection at a time.',
    hi: 'ईपीएफओ के पैसा देने से पहले सात शर्तें पूरी होनी चाहिए। यहाँ आपको सातों एक साथ दिख रही हैं, एक-एक करके रिजेक्शन मिलने के बजाय।',
  },
  {
    id: 'attention',
    label: 'Needs your attention',
    href: '/dashboard',
    selector: '[data-tour="attention"]',
    say: 'These are the things waiting on you today. Tap any card and it opens the exact screen where that one gets fixed.',
    hi: 'ये वे चीज़ें हैं जो आज आपके करने का इंतज़ार कर रही हैं। किसी भी कार्ड पर टैप करें, वही स्क्रीन खुलेगी जहाँ वह ठीक होता है।',
  },
];

/** Every dashboard section becomes a stop, described in its own words. */
const SECTION_STOPS: TourTarget[] = SECTIONS.filter((s) => s.href !== '/dashboard').map((s) => ({
  id: s.href.split('/').pop()!,
  label: s.label,
  href: s.href,
  selector: '[data-tour="page"]',
  say: `${s.label}. ${s.blurb}`,
  hi: `${s.label} - ${s.blurb}`,
}));

export const TOUR_TARGETS: TourTarget[] = [...SITE, ...SECTION_STOPS];

const BY_ID = new Map(TOUR_TARGETS.map((t) => [t.id, t]));

export function tourTarget(id: string): TourTarget | undefined {
  return BY_ID.get(id);
}

/** Target ids the model is allowed to name, plus whatever gates this case has. */
export function allowedTargets(gateIds: string[]): Set<string> {
  return new Set([...BY_ID.keys(), ...gateIds]);
}

/**
 * The tour we give when the language service is down or the model forgets to
 * build one. Written from the case, so it is never generic: the blocking gates
 * come first, then the rest of the product.
 */
export function defaultTour(
  gates: { id: string; title: string; status: string; onCriticalPath: boolean }[],
  hindi: boolean,
): { target: string; say: string }[] {
  const stuck = gates
    .filter((g) => g.status === 'red' || g.status === 'blocked')
    .sort((a, b) => Number(b.onCriticalPath) - Number(a.onCriticalPath))
    .slice(0, 3);

  const line = (t: TourTarget) => ({ target: t.id, say: hindi ? t.hi : t.say });
  const stop = (id: string) => line(BY_ID.get(id)!);

  // The individual gates are laid out in full on Action Center, so they are
  // visited while we are already standing there. Walking somebody back to the
  // overview and out again for each one is a tour of the router, not the site.
  const gateStops = stuck.map((g) => ({
    target: g.id,
    say: hindi
      ? `${g.title} - यह अभी अटका हुआ है${
          g.onCriticalPath ? ', और यही आपकी तारीख़ को रोक रहा है' : ', पर यह आपकी तारीख़ को नहीं रोक रहा'
        }।`
      : `${g.title} is not cleared yet${
          g.onCriticalPath
            ? ', and this is the one holding your date back.'
            : ', though it is not what is holding your date back.'
        }`,
  }));

  const before = ['money', 'employment', 'records'];
  const after = ['pension', 'employer', 'alerts'];

  return [
    stop('overview'),
    stop('countdown'),
    stop('gates'),
    stop('attention'),
    ...before.map(stop),
    stop('actions'),
    ...gateStops,
    ...after.map(stop),
  ];
}
