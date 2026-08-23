import { chromium } from 'playwright';
const OUT = process.env.SHOT_OUT ?? '.';
const B = 'http://localhost:3000';

const SIZES = [
  ['iphone-se',      320, 568],
  ['iphone-12',      390, 844],
  ['pixel-7',        412, 915],
  ['phone-landscape',844, 390],
  ['ipad-mini',      768, 1024],
  ['ipad-pro',      1024, 1366],
  ['laptop',        1280, 800],
  ['desktop',       1680, 1000],
  ['ultrawide',     2560, 1200],
];

const PAGES = ['/', '/login', '/whats-mocked'];
const b = await chromium.launch();
const problems = [];

for (const [name, w, h] of SIZES) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => problems.push(`${name} JS: ${e.message}`));

  // sign in once per context so dashboard routes work
  await p.goto(B + '/login', { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: /Ravi/ }).click().catch(() => {});
  await p.waitForURL('**/dashboard').catch(() => {});

  for (const route of [...PAGES, '/dashboard', '/dashboard/fix/records_agree']) {
    await p.goto(B + route, { waitUntil: 'networkidle' });
    const r = await p.evaluate(() => {
      const de = document.documentElement;
      const overflow = de.scrollWidth - de.clientWidth;
      // anything sticking out past the viewport
      const wide = [...document.querySelectorAll('body *')]
        .filter((el) => {
          const b = el.getBoundingClientRect();
          return b.width > 0 && (b.right > de.clientWidth + 1 || b.left < -1);
        })
        .slice(0, 3)
        .map((el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`);
      // tap targets below the 24px minimum
      const small = [...document.querySelectorAll('a,button')]
        .filter((el) => {
          // sr-only skip links are not tap targets
          if (el.className.toString().includes('sr-only')) return false;
          const b = el.getBoundingClientRect();
          return b.width > 0 && b.height > 0 && (b.height < 24 || b.width < 24);
        })
        .slice(0, 3)
        .map((el) => (el.textContent || '').trim().slice(0, 22) || el.tagName);
      return { overflow, wide, small };
    });
    if (r.overflow > 0) problems.push(`${name} ${route}: overflow ${r.overflow}px [${r.wide.join(', ')}]`);
    if (r.small.length) problems.push(`${name} ${route}: small tap targets [${r.small.join(', ')}]`);
  }
  await p.goto(B + '/dashboard', { waitUntil: 'networkidle' });
  await p.screenshot({ path: `${OUT}/r-${name}.png` });
  await ctx.close();
  console.log(`checked ${name.padEnd(16)} ${w}x${h}`);
}

console.log('\n' + (problems.length ? 'PROBLEMS:\n- ' + problems.join('\n- ') : 'no responsive problems found'));
await b.close();
