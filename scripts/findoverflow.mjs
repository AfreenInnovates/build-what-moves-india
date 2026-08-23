import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 320, height: 568 } });
await p.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
const out = await p.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  return [...document.querySelectorAll('body *')]
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { el, over: Math.round(r.right - vw), w: Math.round(r.width) };
    })
    .filter((x) => x.over > 0)
    .sort((a, b) => b.over - a.over)
    .slice(0, 8)
    .map((x) => ({
      tag: x.el.tagName.toLowerCase(),
      cls: (x.el.className || '').toString().slice(0, 60),
      text: (x.el.textContent || '').trim().slice(0, 40),
      over: x.over,
      width: x.w,
    }));
});
console.table(out);
await b.close();
