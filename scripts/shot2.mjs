import { chromium } from 'playwright';
const OUT = process.env.SHOT_OUT ?? '.';
const B = 'http://localhost:3000';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 1000 }, deviceScaleFactor: 2 });
await page.goto(B + '/login', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Ravi/ }).click();
await page.waitForURL(/\/c\/[0-9a-f-]{36}/);
const id = page.url().split('/c/')[1];
for (const g of ['records_agree', 'service_history', 'uan_active']) {
  await page.goto(`${B}/c/${id}/fix/${g}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/fix-${g}.png`, fullPage: true });
}
await page.goto(B + '/', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${OUT}/p-home.png`, fullPage: true });
await page.goto(B + '/whats-mocked', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${OUT}/p-mocked.png`, fullPage: true });
console.log('shots done for case', id);
await browser.close();
