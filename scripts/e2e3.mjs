import { chromium } from 'playwright';
const OUT = process.env.SHOT_OUT ?? '.';
const B = 'http://localhost:3000';
const browser = await chromium.launch();
const errs = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
page.on('pageerror', (e) => errs.push(String(e)));

let t = Date.now();
await page.goto(B + '/login', { waitUntil: 'networkidle' });
console.log('login page load      ', Date.now() - t, 'ms');

t = Date.now();
await page.getByRole('button', { name: /Ravi/ }).click();
await page.waitForURL('**/dashboard');
await page.waitForSelector('[data-gate]');
console.log('sign in -> dashboard ', Date.now() - t, 'ms');
console.log('url is now:', page.url().replace(B, ''));
await page.screenshot({ path: `${OUT}/d-dash.png`, fullPage: true });

// shared /c/<id> link still resumes, without leaving the id in the bar
const caseId = (await page.context().cookies()).find((c) => c.name === 'case_id')?.value;
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const p2 = await ctx2.newPage();
await p2.goto(`${B}/c/${caseId}`, { waitUntil: 'networkidle' });
console.log('shared link lands on:', p2.url().replace(B, ''), '| days:', await p2.getByTestId('countdown').innerText());
await ctx2.close();

// no reset control anywhere
console.log('reset buttons on page:', await page.getByRole('button', { name: /^Reset$/ }).count());

console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors');
await browser.close();
