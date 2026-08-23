import { chromium } from 'playwright';
const OUT = process.env.SHOT_OUT ?? '.';
const B = 'http://localhost:3000';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 1000 }, deviceScaleFactor: 2 });
const errs = [];
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
page.on('pageerror', (e) => errs.push(String(e)));
const days = () => page.getByTestId('countdown').innerText();

await page.goto(B + '/', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${OUT}/p-home.png`, fullPage: true });

await page.goto(B + '/login', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${OUT}/p-login.png`, fullPage: true });

await page.getByRole('button', { name: /Ravi/ }).click();
await page.waitForURL(/\/c\/[0-9a-f-]{36}/);
const caseUrl = page.url();
console.log('case url:', caseUrl.replace(B, ''));
await page.waitForTimeout(600);
console.log('on open:', await days(), 'days');
await page.screenshot({ path: `${OUT}/p-case.png`, fullPage: true });

// open the recommended gate and complete it
await page.getByRole('link', { name: 'Open this' }).click();
await page.waitForLoadState('networkidle');
await page.screenshot({ path: `${OUT}/p-fix.png`, fullPage: true });
await page.getByRole('button', { name: /Mark this done/ }).click();
await page.waitForTimeout(900);

await page.goto(caseUrl, { waitUntil: 'networkidle' });
await page.waitForTimeout(1400);
console.log('after fixing records:', await days(), 'days');

// THE test: hard reload, does it persist
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);
console.log('after hard reload:', await days(), 'days');

// and a brand new browser context, i.e. someone opening the shared link
const ctx2 = await browser.newContext({ viewport: { width: 430, height: 1000 } });
const p2 = await ctx2.newPage();
await p2.goto(caseUrl, { waitUntil: 'networkidle' });
await p2.waitForTimeout(800);
console.log('fresh browser, same link:', await p2.getByTestId('countdown').innerText(), 'days');
await p2.screenshot({ path: `${OUT}/p-resumed.png`, fullPage: true });

console.log(errs.length ? 'CONSOLE ERRORS:\n' + errs.join('\n') : 'no console errors');
await browser.close();
