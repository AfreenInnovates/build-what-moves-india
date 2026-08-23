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
await p.getByRole('button', { name: /Priya/ }).click();
await p.waitForURL('**/dashboard');
await p.getByRole('button', { name: 'Ask Saathi' }).click();
await p.waitForTimeout(300);
await p.getByRole('button', { name: 'Speak your question' }).click();
await p.waitForTimeout(200);

// words still mid-flight when Ask is pressed
await p.evaluate(() => window.__fire('why is my claim', false));
await p.waitForTimeout(150);
console.log('box shows:', JSON.stringify(await p.locator('textarea').inputValue()));
await p.getByRole('button', { name: 'Ask', exact: true }).click();
await p.waitForTimeout(1200);
const bubbles = await p.locator('.whitespace-pre-wrap').allInnerTexts();
console.log('total bubbles:', bubbles.length);
console.log('last user bubble:', JSON.stringify(bubbles[bubbles.length - 2] ?? bubbles[bubbles.length - 1] ?? 'NONE'));
await b.close();
