import { chromium } from 'playwright';
const OUT = process.env.SHOT_OUT ?? '.';
const B = 'http://localhost:3000';
const b = await chromium.launch();
const errs = [];
for (const [label, w, h] of [['wide', 1680, 1000], ['laptop', 1440, 900], ['mobile', 390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: label === 'mobile' ? 2 : 1 });
  p.on('pageerror', (e) => errs.push(`${label}: ${e.message}`));
  await p.goto(B + '/login', { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: /Ravi/ }).click();
  await p.waitForURL('**/dashboard');
  await p.waitForSelector('[data-gate]');
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/w-${label}.png` });
  const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (label !== 'mobile') {
    const gw = await p.locator('[data-gate]').first().boundingBox();
    console.log(`${label.padEnd(7)} overflow=${o}px  gate card width=${Math.round(gw.width)}px`);
    console.log(`        nav buttons visible: Other cases=${await p.getByRole('link', { name: /Other cases/ }).count()} Home=${await p.getByRole('link', { name: /^⌂ Home$/ }).count()}`);
  } else {
    console.log(`${label.padEnd(7)} overflow=${o}px`);
  }
  await p.goto(B + '/dashboard/fix/records_agree', { waitUntil: 'networkidle' });
  await p.screenshot({ path: `${OUT}/w-${label}-fix.png` });
  await p.close();
}
console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no page errors');
await b.close();
