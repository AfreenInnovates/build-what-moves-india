import { chromium } from 'playwright';
const OUT = process.env.SHOT_OUT ?? '.';
const B = 'http://localhost:3000';
const browser = await chromium.launch();
const errs = [];
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
page.on('pageerror', (e) => errs.push(String(e)));

await page.goto(B + '/login', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${OUT}/n-login.png`, fullPage: true });

// every persona opens and reports its own number
for (const who of ['Ravi', 'Priya', 'Lakshmi', 'Arjun', 'Farhan', 'Sunita']) {
  await page.goto(B + '/login', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: new RegExp(who) }).click();
  await page.waitForURL(/\/c\/[0-9a-f-]{36}/);
  await page.waitForTimeout(500);
  const days = await page.getByTestId('countdown').innerText();
  console.log(`${who.padEnd(9)} ${days.padStart(3)} days`);
}

// the EPFO screen reproduction
await page.goto(B + '/login', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Farhan/ }).click();
await page.waitForURL(/\/c\/[0-9a-f-]{36}/);
const id = page.url().split('/c/')[1];
await page.goto(`${B}/c/${id}/fix/records_agree`, { waitUntil: 'networkidle' });
await page.screenshot({ path: `${OUT}/n-fix-kyc.png`, fullPage: true });

// the from-scratch intake
await page.goto(B + '/start', { waitUntil: 'networkidle' });
await page.getByPlaceholder('Any name will do').fill('Test Person');
await page.screenshot({ path: `${OUT}/n-start.png`, fullPage: true });
await page.getByRole('button', { name: 'Start' }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/n-q1.png`, fullPage: true });

const picks = ['No, or I have never tried', 'I have left', 'Under 5 years', 'Over ₹2 lakh',
               'No', 'No, at least one differs', 'The company has shut down'];
for (const p of picks) {
  await page.getByRole('button', { name: p, exact: false }).first().click();
  await page.waitForTimeout(200);
}
await page.screenshot({ path: `${OUT}/n-review.png`, fullPage: true });
await page.getByRole('button', { name: 'Build my case' }).click();
await page.waitForURL(/\/c\/[0-9a-f-]{36}/, { timeout: 15000 });
await page.waitForTimeout(700);
console.log('self-built case:', await page.getByTestId('countdown').innerText(), 'days');
await page.screenshot({ path: `${OUT}/n-selfcase.png`, fullPage: true });

console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors');
await browser.close();
