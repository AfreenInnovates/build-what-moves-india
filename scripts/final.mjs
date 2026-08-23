import { chromium } from 'playwright';
const OUT = process.env.SHOT_OUT ?? '.';
const B = 'http://localhost:3000';
const b = await chromium.launch();
const ctx = await b.newContext();
await ctx.addInitScript(() => {
  class FakeSR {
    lang=''; continuous=false; interimResults=false;
    onresult=null; onend=null; onerror=null;
    start(){ window.__fire = (t, final) => this.onresult?.({ resultIndex:0, results:{length:1, 0:{isFinal:final, 0:{transcript:t}}} }); }
    stop(){ this.onend?.(); }
  }
  window.SpeechRecognition = FakeSR;
});
const p = await ctx.newPage({ viewport: { width: 1440, height: 950 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));

for (const u of ['/login','/dashboard','/']) await p.goto(B+u).catch(()=>{});

await p.goto(B + '/login', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: /Sunita/ }).click();
await p.waitForURL('**/dashboard');
await p.waitForSelector('[data-gate]');

console.log('nav: logo goes to', await p.getByRole('link', { name: 'Seven Gates' }).getAttribute('href'));
console.log('nav: "Other cases" present?', await p.getByRole('link', { name: 'Other cases' }).count());
console.log('sidebar: back links?', await p.getByRole('link', { name: /Look at another case/ }).count(),
            await p.getByRole('link', { name: /Back to the home page/ }).count());

await p.getByRole('button', { name: 'Ask Saathi' }).click();
await p.waitForTimeout(400);
console.log('bot name shown:', await p.getByText('Saathi', { exact: true }).count());
console.log('"knows X case only" gone:', (await p.getByText(/case only/).count()) === 0);

// growing box
const box = p.locator('textarea');
const h1 = (await box.boundingBox()).height;
await box.fill('This is a much longer question that should wrap onto several lines and make the input box grow taller instead of scrolling inside a single line.');
await p.waitForTimeout(200);
const h2 = (await box.boundingBox()).height;
console.log(`textarea grew: ${Math.round(h1)}px -> ${Math.round(h2)}px`);

// stop button appears while generating
await box.fill('what is blocking me?');
await p.getByRole('button', { name: 'Ask', exact: true }).click();
await p.waitForTimeout(250);
console.log('stop button while thinking:', await p.getByRole('button', { name: 'Stop generating' }).count());
await p.screenshot({ path: `${OUT}/x-bot.png` });
await p.waitForTimeout(6000);

// history survives a reload
await p.reload({ waitUntil: 'networkidle' });
await p.getByRole('button', { name: 'Ask Saathi' }).click();
await p.waitForTimeout(1500);
console.log('messages restored after reload:', await p.locator('.whitespace-pre-wrap').count());
await p.screenshot({ path: `${OUT}/x-history.png` });

console.log(errs.length ? 'ERRORS: ' + errs.slice(0,3).join(' | ') : 'no page errors');
await b.close();
