/**
 * Collects the English strings the interface renders into lib/i18n/strings.json.
 *
 * Most of this site's copy already lives in data modules - the gate spec, the
 * section list, the process notes - so the bulk is pulled straight out of those
 * rather than being maintained by hand. The rest is chrome that lives in JSX and
 * is listed in chrome.json.
 */
import fs from 'node:fs';

/** String literals that follow one of these keys, in these files. */
const FROM = [
  // route labels and the sourcing note under "why N days" live here too
  ['lib/gates/spec.ts', ['title', 'problem', 'blocks', 'label', 'source']],
  ['lib/sections.ts', ['label', 'blurb']],
  ['lib/processes.ts', ['name', 'breaks', 'fix', 'warning']],
  // the case narrative: alert copy and the "what went wrong, where" lines
  ['lib/insights.ts', ['title', 'detail', 'what', 'where', 'more']],
  // the plain-words names for each thing a gate checks
  ['lib/gates/explain.ts', ['name']],
  // the reproduced EPFO screens: field labels, headings and the "in reality" notes
  ['lib/epfo-screens.ts', ['label', 'screenTitle', 'note', 'hint', 'placeholder', 'after']],
];

/** Arrays of plain strings that follow one of these keys. */
const LISTS = [
  ['lib/processes.ts', ['steps']],
  ['lib/processes.ts', ['breaks', 'fix']],
];

/**
 * Files where effectively every string literal is shown to somebody, so it is
 * simpler and safer to take them all than to guess at which keys matter. The
 * filter below drops anything that is obviously not prose.
 */
const ALL_LITERALS = [
  'lib/gates/explain.ts',
  // Key-based matching kept missing things here for reasons that were never
  // going to stop: provenance is built by a helper - p('...', 'published') - so
  // there is no "source:" to match, and Prettier moves a long value onto its own
  // line away from its key. These files are copy from top to bottom, so every
  // literal is taken and the filter below removes what is obviously code.
  'lib/gates/spec.ts',
  'lib/insights.ts',
  'lib/processes.ts',
  'lib/sections.ts',
  'lib/epfo-screens.ts',
];

const out = new Set();

/**
 * Walk the source and return its string literals.
 *
 * This replaced a regex, which was quietly wrong in a way that cost a long time
 * to find. An apostrophe inside a COMMENT - "nobody's", "person's", of which
 * this codebase has many - opened what the regex read as a string, and it then
 * swallowed everything up to the next apostrophe, real strings included.
 * lib/insights.ts yielded 34 literals out of several hundred, and the missing
 * ones were exactly the long paragraphs that kept rendering in English.
 *
 * A scanner that knows where comments are cannot make that mistake.
 */
function literals(src) {
  const found = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];

    if (ch === '/' && next === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      let body = '';
      let interpolated = false;
      i++;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === '\\') {
          body += src[i + 1] === 'n' ? '\n' : src[i + 1];
          i += 2;
          continue;
        }
        if (quote === '`' && src[i] === '$' && src[i + 1] === '{') interpolated = true;
        body += src[i];
        i++;
      }
      i++;
      if (!interpolated) found.push(body);
      continue;
    }
    i++;
  }
  return found;
}

// A JS string literal in any of the three quote styles. Backticks are included
// because a long line of copy is often written as a template literal purely so
// it can be wrapped across several source lines, and those were being missed.
const LITERAL = String.raw`(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|\`((?:[^\`\\$]|\\.)*)\`)`;
const unescape = (s) => s.split(String.raw`\'`).join("'").split(String.raw`\"`).join('"');
const pick = (m) => unescape(m[1] ?? m[2] ?? m[3] ?? m[0]);

for (const [file, keys] of FROM) {
  const src = fs.readFileSync(file, 'utf8');
  for (const key of keys) {
    const re = new RegExp(String.raw`\b` + key + String.raw`:\s*` + LITERAL, 'g');
    let m;
    while ((m = re.exec(src))) out.add(pick(m));
  }
}

for (const [file, keys] of LISTS) {
  const src = fs.readFileSync(file, 'utf8');
  for (const key of keys) {
    const re = new RegExp(String.raw`\b` + key + String.raw`:\s*\[([\s\S]*?)\n\s*\],`, 'g');
    for (const block of src.matchAll(re)) {
      for (const s of block[1].matchAll(new RegExp(LITERAL, 'g'))) out.add(pick(s));
    }
  }
}

for (const file of ALL_LITERALS) {
  for (const v of literals(fs.readFileSync(file, 'utf8'))) {
    // module paths, gate ids, actor names, confidence levels: not copy
    if (v.includes('/') || /^[a-z][a-zA-Z_]*$/.test(v)) continue;
    if (/^[a-z_]+$/.test(v)) continue;
    if (!v.includes(' ') && v.length < 6) continue;
    out.add(v);
  }
}

for (const s of JSON.parse(fs.readFileSync('lib/i18n/chrome.json', 'utf8'))) out.add(s);

/**
 * Anything already wrapped as t('...') anywhere in the app.
 *
 * This is the authoritative list once a page has been wrapped: whatever the code
 * asks the translator for is exactly what the dictionary needs to answer.
 */
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(full);
    else if (/\.tsx?$/.test(e.name)) {
      const src = fs.readFileSync(full, 'utf8');
      // Every string handed to the translator. Plain indexOf rather than a
      // regex: this has been rewritten twice already for escaping reasons, and
      // "find the next t( and read the first literal after it" needs no pattern
      // at all. Stray hits from redirect( and catch( are removed by the filters
      // at the end.
      let at = -1;
      while ((at = src.indexOf('t(', at + 1)) !== -1) {
        const [first] = literals(src.slice(at, at + 4000));
        if (first && first.trim()) out.add(first.trim());
      }
    }
  }
}
walk('app');
walk('components');

const list = [...out]
  .map((s) => s.trim())
  .filter((s) => s.length > 1 && /[a-zA-Z]/.test(s))
  // Drop anything that is plainly code rather than a sentence. The broad sweep
  // over explain.ts picks up fragments of template literals, and a dictionary
  // entry for "${f.serviceGapMonths} months missing" helps nobody.
  .filter((s) => !s.includes('${') && !s.includes('`') && !s.includes('=>'))
  // ...but a string may legitimately START with a placeholder - "{n} of your
  // details do not match" - so those are kept
  .filter((s) => /^\{\w+\}/.test(s) || !/^[:{},.]/.test(s))
  .sort();

fs.writeFileSync('lib/i18n/strings.json', JSON.stringify(list, null, 2) + '\n');
console.log(`${list.length} strings -> lib/i18n/strings.json`);
