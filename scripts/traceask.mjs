import { chromium } from 'playwright';
const B = 'http://localhost:3000';
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
const marks = [];
p.on('request', (r) => {
  const u = r.url();
  if (u.includes('/api/')) marks.push({ url: u.split('/api/')[1].split('?')[0], start: Date.now() });
});
p.on('response', (r) => {
  const u = r.url();
  if (!u.includes('/api/')) return;
  const m = marks.filter((x) => u.includes(x.url) && !x.end).pop();
  if (m) m.end = Date.now();
});

await p.goto(B + '/login', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: /Ravi/ }).click();
await p.waitForURL('**/dashboard');
await p.getByRole('button', { name: 'Ask Saathi' }).click();
await p.waitForTimeout(500);
marks.length = 0;

const t0 = Date.now();
await p.getByPlaceholder('Ask about your claim').fill('what is blocking my claim?');
await p.getByRole('button', { name: 'Ask', exact: true }).click();
await p.waitForTimeout(12000);

console.log('timeline from clicking Ask:\n');
for (const m of marks) {
  console.log(`  +${String(m.start - t0).padStart(5)}ms  ${m.url.padEnd(12)} took ${String((m.end ?? Date.now()) - m.start).padStart(5)}ms`);
}
await b.close();
