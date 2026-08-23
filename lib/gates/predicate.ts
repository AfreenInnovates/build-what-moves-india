import type { CaseFacts, Predicate } from './types';

/** Pure, total, and small enough to read in one sitting — which is the point. */
export function evaluate(p: Predicate, facts: CaseFacts): boolean {
  switch (p.op) {
    case 'true':
      return true;
    case 'is':
      return facts[p.fact] === p.value;
    case 'lt':
      return num(facts, p.fact) < p.value;
    case 'lte':
      return num(facts, p.fact) <= p.value;
    case 'gt':
      return num(facts, p.fact) > p.value;
    case 'gte':
      return num(facts, p.fact) >= p.value;
    case 'all':
      return p.of.every((q) => evaluate(q, facts));
    case 'any':
      return p.of.some((q) => evaluate(q, facts));
    case 'not':
      return !evaluate(p.of, facts);
  }
}

function num(facts: CaseFacts, key: keyof CaseFacts): number {
  const v = facts[key];
  if (typeof v !== 'number') {
    throw new TypeError(`predicate: fact "${key}" is ${typeof v}, expected number`);
  }
  return v;
}

/** Convenience builders so the spec reads like prose. */
export const yes = (fact: keyof CaseFacts): Predicate => ({ op: 'is', fact, value: true });
export const no = (fact: keyof CaseFacts): Predicate => ({ op: 'is', fact, value: false });
export const all = (...of: Predicate[]): Predicate => ({ op: 'all', of });
export const any = (...of: Predicate[]): Predicate => ({ op: 'any', of });
export const not = (of: Predicate): Predicate => ({ op: 'not', of });
export const always: Predicate = { op: 'true' };
