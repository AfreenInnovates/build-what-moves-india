import { chromium } from 'playwright';
const B = 'http://localhost:3000';
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await p.goto(B + '/login', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: /Lakshmi/ }).click();
await p.waitForURL('**/dashboard');

const ask = async (q) => {
  const t = Date.now();
  const r = await p.evaluate(async (message) => {
    const res = await fetch('/api/assistant', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    return res.json();
  }, q);
  console.log(`\nQ: ${q}  (${Date.now() - t}ms)`);
  console.log(`A: ${r.reply}`);
  if (r.tour) console.log(`   TOUR: ${r.tour.map(s => s.gateId).join(' -> ')}`);
};

await ask('what is blocking my claim?');
await ask('how do I fix the records problem?');
await ask("tell me about Ravi Kumar Sharma's case");
await ask('walk me through my gates');
await b.close();
