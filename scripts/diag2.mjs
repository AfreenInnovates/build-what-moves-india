import { chromium } from 'playwright';
const B = 'http://localhost:3000';
const b = await chromium.launch();
const p = await b.newPage();
p.on('response', async (r) => {
  if (r.request().method() === 'POST' || r.status() >= 400) {
    console.log(r.status(), r.request().method(), r.url().replace(B, ''));
    if (r.status() >= 400) {
      const t = await r.text().catch(() => '');
      console.log('   body:', t.slice(0, 800).replace(/\s+/g, ' '));
    }
  }
});
await p.goto(B + '/login', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: /Ravi/ }).click();
await p.waitForTimeout(5000);
console.log('final URL:', p.url());
await b.close();
