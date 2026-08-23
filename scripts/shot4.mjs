import { chromium } from 'playwright';
const OUT = process.env.SHOT_OUT ?? '.';
const B = 'http://localhost:3000';
const browser = await chromium.launch();
const errs = [];
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
page.on('pageerror', (e) => errs.push(String(e)));

await page.goto(B + '/login', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Ravi/ }).click();
await page.waitForURL(/\/c\/[0-9a-f-]{36}/);
const id = page.url().split('/c/')[1];

for (const [name, url] of [['home', '/'], ['case', `/c/${id}`], ['fix', `/c/${id}/fix/service_history`], ['uan', `/c/${id}/fix/uan_active`], ['login', '/login']]) {
  await page.goto(B + url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/us-${name}.png`, fullPage: true });
  const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(`${name.padEnd(6)} overflow=${o}px`);
}
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await m.goto(B + `/c/${id}/fix/service_history`, { waitUntil: 'networkidle' });
await m.screenshot({ path: `${OUT}/us-fix-mobile.png`, fullPage: true });
console.log('mobile overflow=', await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors');
await browser.close();
