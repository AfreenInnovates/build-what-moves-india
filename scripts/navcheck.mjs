import { chromium } from 'playwright';
const OUT = process.env.SHOT_OUT ?? '.';
const B = 'http://localhost:3000';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1680, height: 1000 } });
await p.goto(B + '/login', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: /Ravi/ }).click();
await p.waitForURL('**/dashboard');
await p.waitForSelector('[data-gate]');

const side = p.locator('aside');
console.log('sidebar "Other cases":', await side.getByRole('link', { name: 'Other cases' }).count());
console.log('sidebar "Home":       ', await side.getByRole('link', { name: 'Home', exact: true }).count());
const box = await side.getByRole('link', { name: 'Other cases' }).boundingBox();
console.log('nav button top offset:', Math.round(box.y), 'px (was ~700 before)');
console.log('"Why 1 days?" gone:   ', (await p.getByText('Why 1 days?').count()) === 0);
console.log('"Why 1 day?" present: ', await p.getByText('Why 1 day?').count());
const btn = await p.getByRole('link', { name: 'Fix this' }).first().boundingBox();
console.log('Fix button width:     ', Math.round(btn.width), 'px');
await p.screenshot({ path: `${OUT}/w-final.png` });

// mobile still has a way out via the header
const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await m.goto(B + '/dashboard', { waitUntil: 'networkidle' });
console.log('mobile header nav:    ', await m.getByRole('link', { name: 'Other cases' }).count(),
            'other-cases,', await m.getByRole('link', { name: 'My claim' }).count(), 'my-claim');
await m.screenshot({ path: `${OUT}/w-mobile-final.png`, fullPage: false });
await b.close();
