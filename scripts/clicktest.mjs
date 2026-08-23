import { chromium } from 'playwright';
const B = process.env.TARGET ?? 'http://localhost:3000';
const b = await chromium.launch();
const p = await b.newPage();
const posts = [];
p.on('request', (r) => { if (r.method() === 'POST') posts.push(r.url().replace(B, '')); });

await p.goto(B + '/login', { waitUntil: 'networkidle' });

// exactly ONE click on a card
const before = p.url();
await p.getByRole('button', { name: /Ravi/ }).click();
await p.waitForTimeout(4000);
console.log('after 1 click:', before.replace(B,''), '->', p.url().replace(B, ''));
console.log('POSTs fired:', posts.join(', ') || 'none');

// now a single click on a sidebar gate link
posts.length = 0;
const u1 = p.url();
await p.getByRole('link', { name: 'e-Nomination filed' }).first().click().catch(e => console.log('link click failed:', e.message.slice(0,60)));
await p.waitForTimeout(3000);
console.log('sidebar link 1 click:', u1.replace(B,''), '->', p.url().replace(B, ''));

// single click "Home" in header
posts.length = 0;
await p.getByRole('link', { name: 'Seven Gates' }).click();
await p.waitForTimeout(3000);
console.log('header logo 1 click ->', p.url().replace(B, ''));
await b.close();
