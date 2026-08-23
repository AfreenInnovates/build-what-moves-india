import { chromium } from 'playwright';
const OUT = process.env.SHOT_OUT ?? '.';
const B = 'http://localhost:3000';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 950 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));

await p.goto(B + '/login', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: /Ravi/ }).click();
await p.waitForURL('**/dashboard');
await p.waitForSelector('[data-gate]');
await p.waitForTimeout(700);
await p.screenshot({ path: `${OUT}/f-dash.png` });

const open = () => p.getByRole('button', { name: 'Ask about your case' }).click();
const say = async (q) => {
  await p.getByPlaceholder('Ask about your case').fill(q);
  await p.getByRole('button', { name: 'Ask', exact: true }).click();
};

await open();
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/f-bot-open.png` });

// a question that answers in place
await say('how many working days until my money arrives, and why?');
await p.waitForTimeout(6000);
await p.screenshot({ path: `${OUT}/f-bot-answer.png` });
console.log('panel still open:', await p.getByPlaceholder('Ask about your case').count());

// a question that launches the guided tour
await say('walk me through each gate');
await p.waitForTimeout(9000);
const touring = await p.getByRole('button', { name: /^(Next|Done)$/ }).count();
console.log('tour running:', touring > 0);
await p.screenshot({ path: `${OUT}/f-tour.png` });
if (touring) {
  await p.getByRole('button', { name: /^(Next|Done)$/ }).click();
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/f-tour2.png` });
}

console.log('URL:', p.url().replace(B, ''));
console.log(errs.length ? 'ERRORS: ' + errs.slice(0, 3).join(' | ') : 'no page errors');
await b.close();
