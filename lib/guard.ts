import 'server-only';
import { cookies } from 'next/headers';

/**
 * Guards for the API routes.
 *
 * These endpoints spend money — each one calls a metered third-party API — and
 * they are reachable by anyone who loads the page. Without a ceiling, a single
 * open tab running a loop drains the quota for everybody, and the demo dies
 * mid-judging.
 */

/** The signed-in case, or null. Never trust a case id from the request body. */
export async function caseIdFromCookie(): Promise<string | null> {
  return (await cookies()).get('case_id')?.value ?? null;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * A small fixed-window limiter, keyed per case.
 *
 * In-memory, so it resets on deploy and does not span serverless instances —
 * it is a guard rail against a runaway client, not a defence against a
 * determined attacker. Anything stronger needs Redis or Postgres, which is not
 * worth the round trip here.
 */
export function withinLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);

  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // opportunistic cleanup so the map cannot grow without bound
    if (buckets.size > 500) {
      for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
    }
    return true;
  }

  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

/** Bytes, not characters — a multibyte payload should not slip past the cap. */
export function tooLarge(text: string, maxBytes: number): boolean {
  return new TextEncoder().encode(text).length > maxBytes;
}
