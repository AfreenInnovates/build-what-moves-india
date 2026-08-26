/**
 * Builds lib/i18n/<lang>.json from the English strings the site actually renders.
 *
 * Translation is done once, here, and checked in - not at request time. A page
 * that calls a model to render itself is slow, costs tokens per view, and fails
 * when the model does; a checked-in dictionary is none of those things, and it
 * can be read and corrected by a human who speaks the language.
 *
 *   node scripts/translate.mjs           # fill in whatever is missing
 *   node scripts/translate.mjs --all     # redo everything
 */
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const LANGS = { hi: 'Hindi', kn: 'Kannada' };
const OUT = 'lib/i18n';
const SOURCE = 'lib/i18n/strings.json';
const redo = process.argv.includes('--all');

const strings = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
console.log(`${strings.length} source strings`);

const SYSTEM = (lang) => `You translate the interface of a tool that helps Indian workers get their
provident fund (EPF) savings released. Translate each string into ${lang}, in its own script.

Rules:
- The readers may have little formal education. Use everyday spoken words, not officialese.
- Keep it about the same length. These are buttons, headings and short explanations.
- Numbers stay as digits: 15 stays 15, never a ${lang} numeral.
- Leave these exactly as they are, in English, because they are printed that way on the
  real EPFO forms and screens: UAN, Aadhaar, PAN, EPFO, EPF, KYC, UMANG, DigiLocker,
  e-Nomination, Form 15G, Form 19, Form 10C, Form 31, IFSC, OTP, PF.
- Keep any {placeholder} untouched.
- Do not add anything. Do not explain. Translate only.

Reply with JSON: {"out": ["<translation of string 1>", "<translation of string 2>", ...]}
with exactly as many entries as you were given, in the same order.`;

async function translate(batch, langName) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL_REASONING ?? 'openai/gpt-oss-20b',
      temperature: 0.2,
      max_tokens: 1400,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM(langName) },
        { role: 'user', content: JSON.stringify(batch) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
  const parsed = JSON.parse((await res.json()).choices?.[0]?.message?.content ?? '{}');
  if (!Array.isArray(parsed.out) || parsed.out.length !== batch.length) {
    throw new Error(`expected ${batch.length} back, got ${parsed.out?.length}`);
  }
  return parsed.out.map(String);
}

for (const [code, langName] of Object.entries(LANGS)) {
  const file = path.join(OUT, `${code}.json`);
  const existing = redo ? {} : JSON.parse(fs.readFileSync(file, 'utf8'));

  const orphans = Object.keys(existing).filter((k) => !strings.includes(k));
  if (orphans.length) {
    console.log(`  ${code}: dropping ${orphans.length} orphaned (English text changed)`);
    for (const k of orphans) delete existing[k];
  }

  const todo = strings.filter((s) => !existing[s]);
  console.log(`${code} (${langName}): ${todo.length} to translate, ${Object.keys(existing).length} already done`);

  // small batches: one bad batch costs little, and short strings confuse a model
  // less when it is not holding two hundred of them at once
  // The free tier counts prompt + max_tokens against 8,000 tokens per minute, so
  // an ambitious batch is rejected outright with a 413 before it even runs.
  // Small batches and a pause between them keep every request under the ceiling.
  const SIZE = 8;
  for (let i = 0; i < todo.length; i += SIZE) {
    const batch = todo.slice(i, i + SIZE);
    process.stdout.write(`  ${code} ${i + 1}-${i + batch.length}/${todo.length} ... `);
    let done = false;
    for (let attempt = 0; attempt < 3 && !done; attempt++) {
      try {
        const out = await translate(batch, langName);
        batch.forEach((s, j) => (existing[s] = out[j]));
        console.log('ok');
        done = true;
      } catch (e) {
        const rate = /429|413/.test(e.message);
        if (rate && attempt < 2) {
          await new Promise((r) => setTimeout(r, 30_000));
          process.stdout.write('retry ... ');
        } else if (batch.length > 1) {
          // The model sometimes returns the wrong number of lines for a batch,
          // and there is no way to tell which one it dropped. One at a time
          // cannot be miscounted, so the stragglers are retried singly rather
          // than left permanently untranslated.
          console.log('splitting');
          for (const single of batch) {
            try {
              const [only] = await translate([single], langName);
              existing[single] = only;
            } catch {
              console.log('  could not translate: ' + single.slice(0, 60));
            }
            await new Promise((r) => setTimeout(r, 12_000));
          }
          done = true;
        } else {
          console.log('FAILED: ' + e.message.slice(0, 90));
        }
      }
    }
    fs.writeFileSync(file, JSON.stringify(sorted(existing), null, 2) + '\n');
    await new Promise((r) => setTimeout(r, 21_000)); // stay under 8k tokens/min
  }
  console.log(`${code}: ${Object.keys(existing).length}/${strings.length} translated`);
}

function sorted(o) {
  return Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
}
