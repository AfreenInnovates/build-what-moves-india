import { chromium } from 'playwright';
const OUT = process.env.SHOT_OUT ?? '.';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
for (const [n, u] of [['login', '/login'], ['start', '/start']]) {
  await p.goto('http://localhost:3000' + u, { waitUntil: 'networkidle' });
  await p.screenshot({ path: `${OUT}/m-${n}.png`, fullPage: true });
  console.log(n, 'overflow=', await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
}
await b.close();
