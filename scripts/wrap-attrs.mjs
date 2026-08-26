/**
 * Wraps prose passed as a JSX attribute - label="...", sub="...", title="..." -
 * with the translator.
 *
 * The text-node codemod leaves attributes alone on purpose, because most
 * attributes are class names, hrefs and ids that must not be touched. This pass
 * handles the small, named set that carries words a person reads.
 *
 *   node scripts/wrap-attrs.mjs app/dashboard/money/page.tsx
 */
import fs from 'node:fs';

/** Attributes whose value is shown to the reader. */
const PROPS = ['label', 'sub', 'title', 'lead', 'caption', 'heading', 'note', 'placeholder'];

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node scripts/wrap-attrs.mjs <file...>');
  process.exit(1);
}

const q = (s) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

let total = 0;
for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  let n = 0;

  for (const prop of PROPS) {
    const re = new RegExp(String.raw`\b${prop}="([^"{}<>]{4,})"`, 'g');
    src = src.replace(re, (whole, text) => {
      if (!/[a-zA-Z]{3}/.test(text)) return whole;
      n++;
      return `${prop}={t(${q(text)})}`;
    });
  }

  fs.writeFileSync(file, src);
  total += n;
  console.log(`${file}: wrapped ${n}`);
}
console.log(`${total} attributes wrapped`);
