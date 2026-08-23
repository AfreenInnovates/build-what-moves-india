import { chromium } from 'playwright';
const OUT = process.env.SHOT_OUT ?? '.';
const B = 'http://localhost:3000';
const b = await chromium.launch();
const ctx = await b.newContext();

// stand in for the browser's speech engine so we can drive interim results
await ctx.addInitScript(() => {
  class FakeSR {
    lang = ''; continuous = false; interimResults = false;
    onresult = null; onend = null; onerror = null;
    start() {
      window.__fire = (chunks) => {
        let idx = 0;
        for (const c of chunks) {
          const results = { length: 1, 0: { isFinal: c.final, 0: { transcript: c.text } } };
          this.onresult?.({ resultIndex: 0, results });
          idx++;
        }
      };
    }
    stop() { this.onend?.(); }
  }
  window.SpeechRecognition = FakeSR;
});

const p = await ctx.newPage();
await p.goto(B + '/login', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: /Ravi/ }).click();
await p.waitForURL('**/dashboard');
await p.getByRole('button', { name: 'Ask about your case' }).click();
await p.waitForTimeout(300);

await p.getByRole('button', { name: 'Speak your question' }).click();
await p.waitForTimeout(200);
console.log('input while listening, before speech:', JSON.stringify(await p.getByPlaceholder(/Listening/).inputValue()));

await p.evaluate(() => window.__fire([{ text: 'why is my', final: false }]));
await p.waitForTimeout(200);
console.log('interim 1:', JSON.stringify(await p.locator('input').first().inputValue()));

await p.evaluate(() => window.__fire([{ text: 'why is my claim stuck', final: false }]));
await p.waitForTimeout(200);
console.log('interim 2:', JSON.stringify(await p.locator('input').first().inputValue()));
console.log('shows "hearing you"?', await p.getByText(/hearing you/).count());
await p.screenshot({ path: `${OUT}/v-listening.png` });

await p.evaluate(() => window.__fire([{ text: 'why is my claim stuck?', final: true }]));
await p.waitForTimeout(200);
console.log('final:  ', JSON.stringify(await p.locator('input').first().inputValue()));
await b.close();
