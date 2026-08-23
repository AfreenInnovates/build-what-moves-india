import { chromium } from 'playwright';
const OUT = process.env.SHOT_OUT ?? '.';
const browser = await chromium.launch();
const errs = [];
for (const [label, w, h] of [['desktop', 1280, 900], ['mobile', 390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: label === 'mobile' ? 2 : 1 });
  page.on('console', (m) => m.type() === 'error' && errs.push(`${label}: ${m.text()}`));
  page.on('pageerror', (e) => errs.push(`${label}: ${e}`));
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/home-${label}.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(`${label}: horizontal overflow = ${overflow}px`);
  await page.close();
}
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors');
await browser.close();
