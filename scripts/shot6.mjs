import { chromium } from 'playwright';
const OUT = process.env.SHOT_OUT ?? '.';
const B = 'http://localhost:3000';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 950 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
for (const u of ['/', '/login', '/dashboard', '/whats-mocked']) await p.goto(B+u).catch(()=>{});

await p.goto(B + '/', { waitUntil: 'networkidle' });
await p.screenshot({ path: `${OUT}/s-home.png`, fullPage: false });
console.log('hero says "one in four":', await p.getByText(/about one in four/).count());
console.log('old "one in five" gone:', (await p.getByText(/one in five/).count()) === 0);
console.log('curl transcript gone:', (await p.getByText(/curl -sI/).count()) === 0);

await p.goto(B + '/login', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: /Lakshmi/ }).click();
await p.waitForURL('**/dashboard');
await p.waitForSelector('[data-gate]');
console.log('Lakshmi now at:', await p.getByTestId('countdown').innerText(), 'days');

const why = p.getByText(/^Why \d+ days\?$/).first();
console.log('"Why N days?" present:', await why.count());
await why.click();
await p.waitForTimeout(300);
console.log('shows confidence label:', await p.getByText(/Our estimate|Published rule|Reported figure/).count());
console.log('shows last-checked date:', await p.getByText(/Last checked 2026-08-24/).count());
await p.screenshot({ path: `${OUT}/s-why.png` });

await p.goto(B + '/whats-mocked', { waitUntil: 'networkidle' });
console.log('sources section:', await p.getByText(/Where the numbers come from/).count());
console.log('EPFO counter-argument:', await p.getByText(/EPFO’s side of it|EPFO's side of it/).count());
console.log('observation note:', await p.getByText(/No automated access/).count());
await p.screenshot({ path: `${OUT}/s-sources.png`, fullPage: true });

console.log(errs.length ? 'ERRORS: ' + errs.slice(0,3).join(' | ') : 'no page errors');
await b.close();
