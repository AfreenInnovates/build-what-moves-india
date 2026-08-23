import { chromium } from 'playwright';
const OUT = process.env.SHOT_OUT ?? '.';
const B = 'http://localhost:3000';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 950 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));

// warm routes so we measure runtime not the dev compiler
for (const u of ['/login', '/dashboard', '/']) await p.goto(B + u).catch(() => {});

await p.goto(B + '/login', { waitUntil: 'networkidle' });
let t = Date.now();
await p.getByRole('button', { name: /Lakshmi/ }).click();
await p.waitForURL('**/dashboard');
await p.waitForSelector('[data-gate]');
console.log('sign-in (warm):', Date.now() - t, 'ms');

console.log('header shows "Open a demo"?', await p.getByRole('link', { name: 'Open a demo' }).count());
console.log('header shows "My claim"?  ', await p.getByRole('link', { name: 'My claim' }).count());
console.log('sidebar "Switch case"?    ', await p.getByRole('button', { name: 'Switch case' }).count());
await p.screenshot({ path: `${OUT}/v-dash.png` });

// voice round trip
await p.getByRole('button', { name: 'Ask about your case' }).click();
await p.waitForTimeout(300);
t = Date.now();
await p.getByPlaceholder('Ask about your case').fill('what is blocking me?');
await p.getByRole('button', { name: 'Ask', exact: true }).click();
await p.waitForFunction(() => document.querySelectorAll('div').length > 0 && !!document.body.innerText.match(/working days|employer|Joint/i), null, { timeout: 20000 }).catch(()=>{});
console.log('assistant text visible in:', Date.now() - t, 'ms');
await p.waitForTimeout(3000);
await p.screenshot({ path: `${OUT}/v-bot.png` });

console.log(errs.length ? 'ERRORS: ' + errs.slice(0,3).join(' | ') : 'no page errors');
await b.close();
