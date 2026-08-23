import { chromium } from 'playwright';
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
const p = await ctx.newPage();
await p.goto(B + '/login', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: /Arjun/ }).click();   // untouched case, no history
await p.waitForURL('**/dashboard');
await p.getByRole('button', { name: 'Ask Saathi' }).click();
await p.waitForTimeout(400);
await p.getByRole('button', { name: 'Speak your question' }).click();
await p.waitForTimeout(200);

await p.evaluate(() => window.__fire('why is my claim', false));   // still interim
await p.waitForTimeout(150);
console.log('box before sending:', JSON.stringify(await p.locator('textarea').inputValue()));
await p.getByRole('button', { name: 'Ask', exact: true }).click();
await p.waitForTimeout(600);
const bubbles = await p.locator('.whitespace-pre-wrap').allInnerTexts();
console.log('first bubble posted: ', JSON.stringify(bubbles[0] ?? 'NONE'));
console.log('  -> the interim words survived:', bubbles[0] === 'why is my claim');
await b.close();
