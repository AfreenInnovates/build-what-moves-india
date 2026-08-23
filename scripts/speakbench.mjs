import { chromium } from 'playwright';
const B = 'http://localhost:3000';
const b = await chromium.launch();
const ctx = await b.newContext();
const p = await ctx.newPage();

const calls = [];
p.on('request', (r) => {
  if (r.url().includes('/api/speak')) {
    try { calls.push({ len: JSON.parse(r.postData() || '{}').text?.length ?? 0, t: Date.now() }); } catch {}
  }
});
p.on('response', async (r) => {
  if (r.url().includes('/api/speak')) {
    const c = calls[calls.length - 1];
    if (c && !c.done) { c.done = Date.now() - c.t; }
  }
});

await p.goto(B + '/login', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: /Ravi/ }).click();
await p.waitForURL('**/dashboard');
await p.getByRole('button', { name: 'Ask Saathi' }).click();
await p.waitForTimeout(400);

const t0 = Date.now();
await p.getByPlaceholder('Ask about your claim').fill('explain in detail everything that is blocking my claim and what I should do about each one');
await p.getByRole('button', { name: 'Ask', exact: true }).click();

// wait for the first /api/speak to come back
await p.waitForResponse((r) => r.url().includes('/api/speak'), { timeout: 30000 });
console.log('time from Ask to FIRST audio ready:', Date.now() - t0, 'ms');
await p.waitForTimeout(9000);

console.log('\nchunks requested:');
calls.forEach((c, i) => console.log(`  chunk ${i + 1}: ${String(c.len).padStart(4)} chars -> ${c.done ?? '?'}ms`));
await b.close();
