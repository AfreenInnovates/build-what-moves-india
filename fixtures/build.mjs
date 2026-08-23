import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { templates } from './templates.mjs';

const degrade = process.argv.includes('--degrade');
const outDir = 'fixtures/out';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
const written = [];

for (const f of fs.readdirSync('fixtures/data').filter(f => f.endsWith('.json'))) {
  const person = path.basename(f, '.json');
  const d = JSON.parse(fs.readFileSync(path.join('fixtures/data', f), 'utf8'));

  for (const [kind, render] of Object.entries(templates)) {
    const doc = d.documents[kind];
    if (!doc) continue;

    let html = render(doc);
    if (degrade) {
      // simulate a phone photo: slight skew, soft focus, uneven lighting
      html = html.replace('</style>', `
        body{transform:rotate(-1.4deg) scale(.97);filter:blur(.7px) contrast(.94) brightness(1.04)}
        body::after{content:'';position:absolute;inset:0;z-index:20;pointer-events:none;
          background:linear-gradient(115deg,rgba(0,0,0,.16) 0%,transparent 38%,rgba(255,255,255,.13) 72%,rgba(0,0,0,.1) 100%)}
      </style>`);
    }

    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const el = await page.$('body');
    const box = await el.boundingBox();
    await page.setViewportSize({ width: Math.ceil(box.width), height: Math.ceil(box.height) });

    const suffix = degrade ? '.photo.jpg' : '.png';
    const file = path.join(outDir, `${person}-${kind}${suffix}`);
    await page.screenshot({
      path: file,
      ...(degrade ? { type: 'jpeg', quality: 62 } : { type: 'png' }),
    });
    written.push({ file, script: doc.script, name: doc.name_native ?? doc.name });
  }
}

await browser.close();
console.table(written);
console.log(`\n${written.length} files -> ${outDir}${degrade ? '  (degraded)' : ''}`);
