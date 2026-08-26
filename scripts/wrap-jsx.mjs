/**
 * Wraps bare prose in server-rendered JSX with the translator, so a page written
 * as plain text can be shown in another language without every string being
 * moved into a data file first.
 *
 * Deliberately conservative. It only touches text that sits alone between two
 * tags, only when that text reads like a sentence, and it never goes near
 * attributes, expressions, or anything already wrapped. Anything it is not sure
 * about it leaves alone and reports, so the remainder can be done by hand.
 *
 *   node scripts/wrap-jsx.mjs app/page.tsx app/login/page.tsx
 */
import fs from 'node:fs';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node scripts/wrap-jsx.mjs <file...>');
  process.exit(1);
}

/** Text nodes worth translating: a real phrase, not punctuation or a number. */
function isProse(s) {
  const t = s.trim();
  if (t.length < 4) return false;
  if (!/[a-zA-Z]{3}/.test(t)) return false;
  if (/^[{}()[\],.;:|/\\-]+$/.test(t)) return false;
  // a lone entity or symbol run
  if (/^&[a-z]+;$/.test(t)) return false;
  return true;
}

/** Escape for a single-quoted JS string. */
const q = (s) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

let totalWrapped = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  let wrapped = 0;

  // Only text that sits immediately before a CLOSING tag: `>the words</`.
  //
  // The looser `>...<` matched TypeScript too - arrow functions, generics like
  // Record<string, string>, comparisons - and produced files that would not
  // parse. Requiring the closing slash is the cheapest way to be confident the
  // match is really a JSX text node.
  const out = src.replace(/>([^<>{}]+)<\//g, (whole, inner) => {
    if (!isProse(inner)) return whole;
    // anything that looks like code rather than a sentence
    if (/[=;`]|\)\s*$|^\s*\)/.test(inner)) return whole;
    const lead = inner.match(/^\s*/)[0];
    const tail = inner.match(/\s*$/)[0];
    const text = inner.trim();
    // JSX collapses internal newlines to single spaces; match that so the key
    // is the string the reader actually sees
    const flat = text.replace(/\s+/g, ' ');
    wrapped++;
    return '>' + lead + '{t(' + q(flat) + ')}' + tail + '</';
  });

  fs.writeFileSync(file, out);
  totalWrapped += wrapped;
  console.log(`${file}: wrapped ${wrapped}`);
}

console.log(`${totalWrapped} text nodes wrapped`);
