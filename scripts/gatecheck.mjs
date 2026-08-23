import { chromium } from 'playwright';
const OUT = process.env.SHOT_OUT ?? '.';
const B = 'http://localhost:3000';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));

await p.goto(B + '/login', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: /Lakshmi/ }).click();
await p.waitForURL('**/dashboard');
await p.waitForSelector('[data-gate]');

console.log('"See what was checked" links:', await p.getByRole('link', { name: /See what was checked/ }).count());
console.log('"See what it will check" links:', await p.getByRole('link', { name: /See what it will check/ }).count());

// a cleared gate
await p.goto(B + '/dashboard/fix/e_nomination', { waitUntil: 'networkidle' });
console.log('\ncleared gate header:', (await p.getByText(/Cleared — here is exactly what was checked/).count()) ? 'shown' : 'MISSING');
const rows = await p.locator('section ul li').allInnerTexts();
console.log('checks listed:', rows.slice(0, 4).map(r => r.replace(/\s+/g, ' ')).join(' | '));
await p.screenshot({ path: `${OUT}/g-cleared.png`, fullPage: false });

// a not-applicable gate
await p.goto(B + '/dashboard/fix/attachments', { waitUntil: 'networkidle' });
console.log('\nnot-applicable header:', (await p.getByText(/Does not apply to you — here is why/).count()) ? 'shown' : 'MISSING');
const rows2 = await p.locator('section ul li').allInnerTexts();
console.log('why not:', rows2.slice(0, 3).map(r => r.replace(/\s+/g, ' ')).join(' | '));
await p.screenshot({ path: `${OUT}/g-na.png`, fullPage: false });

// a blocking gate
await p.goto(B + '/dashboard/fix/records_agree', { waitUntil: 'networkidle' });
const rows3 = await p.locator('section ul li').allInnerTexts();
console.log('\nblocking gate checks:', rows3.slice(0, 3).map(r => r.replace(/\s+/g, ' ')).join(' | '));

// the voice toggle
await p.goto(B + '/dashboard', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: 'Ask Saathi' }).click();
await p.waitForTimeout(300);
const v = p.getByRole('button', { name: /Voice o/ });
const box = await v.boundingBox();
console.log('\nvoice toggle:', Math.round(box.width), 'x', Math.round(box.height), 'px, aria-pressed=', await v.getAttribute('aria-pressed'));
await p.screenshot({ path: `${OUT}/g-voice.png` });

console.log(errs.length ? 'ERRORS: ' + errs.slice(0,3).join(' | ') : '\nno page errors');
await b.close();
