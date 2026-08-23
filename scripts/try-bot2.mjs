import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: /Lakshmi/ }).click();
await p.waitForURL('**/dashboard');
const r = await p.evaluate(async () => {
  const res = await fetch('/api/assistant', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: "tell me about Ravi Kumar Sharma's UAN and his case" }),
  });
  return res.json();
});
console.log('status field:', r.error ?? 'ok');
console.log('reply:', r.reply);
await b.close();
