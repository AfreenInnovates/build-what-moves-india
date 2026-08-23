import { chromium } from 'playwright';
const OUT = process.env.SHOT_OUT ?? '.';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 1000 }, deviceScaleFactor: 2 });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

const days = () => page.getByTestId('countdown').innerText();

await page.goto('http://localhost:3000/status/ravi', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${OUT}/ravi-00-start.png`, fullPage: true });
console.log('start:', await days(), 'days');

// walk the critical path and watch the number fall
for (const step of ['Your four records agree', 'Date of exit marked', 'Service history clean']) {
  const card = page.locator('li', { hasText: step }).first();
  const btn = card.getByRole('button', { name: 'Mark this fixed' });
  if (!(await btn.count())) { console.log(`  (${step} not actionable yet)`); continue; }
  await btn.click();
  await page.waitForTimeout(1300);
  console.log(`after "${step}":`, await days(), 'days');
}
await page.screenshot({ path: `${OUT}/ravi-01-partial.png`, fullPage: true });

// finish the quick ones
for (let i = 0; i < 4; i++) {
  const btn = page.getByRole('button', { name: 'Mark this fixed' }).first();
  if (!(await btn.count())) break;
  await btn.click();
  await page.waitForTimeout(900);
}
console.log('all clear:', await days(), 'days');
await page.screenshot({ path: `${OUT}/ravi-02-clear.png`, fullPage: true });

await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${OUT}/home.png`, fullPage: true });

console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
