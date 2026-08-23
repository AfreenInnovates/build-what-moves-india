import { chromium } from 'playwright';
const B = 'http://localhost:3000';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 950 } });

// warm every route first so we measure runtime, not the dev compiler
for (const u of ['/login', '/dashboard', '/']) await p.goto(B + u).catch(() => {});
await p.goto(B + '/login', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: /Ravi/ }).click();
await p.waitForURL('**/dashboard');
await p.goto(B + '/dashboard/fix/records_agree').catch(() => {});

console.log('--- warm timings (compiler cache hot) ---');
for (let i = 0; i < 3; i++) {
  let t = Date.now();
  await p.goto(B + '/login', { waitUntil: 'domcontentloaded' });
  const login = Date.now() - t;

  t = Date.now();
  await p.getByRole('button', { name: /Priya/ }).click();
  await p.waitForURL('**/dashboard');
  await p.waitForSelector('[data-gate]');
  const signin = Date.now() - t;

  t = Date.now();
  await p.goto(B + '/dashboard/fix/e_nomination', { waitUntil: 'domcontentloaded' });
  const fix = Date.now() - t;

  console.log(`run ${i + 1}:  login ${login}ms   sign-in ${signin}ms   fix page ${fix}ms`);
}
await b.close();
