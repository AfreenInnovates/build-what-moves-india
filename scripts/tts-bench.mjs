import 'dotenv/config';
const K = process.env.SARVAM_API_KEY;
const short = 'Your records do not match. Your employer must fix it. About ten working days.';
const long  = 'Your claim is stuck because the four records gate is red. Any claim you file is rejected until the data mismatch is resolved. Your employer can raise this on the Employer Portal and it takes about ten working days. The correct form gate is also waiting on you.';

const bench = async (model, text, label) => {
  const t = Date.now();
  const r = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: { 'api-subscription-key': K, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, target_language_code: 'en-IN', model }),
  });
  const ms = Date.now() - t;
  if (!r.ok) { console.log(`${label.padEnd(26)} ${model.padEnd(12)} FAILED ${r.status}`); return; }
  const j = await r.json();
  const bytes = (j.audios?.[0]?.length ?? 0) * 0.75;
  console.log(`${label.padEnd(26)} ${model.padEnd(12)} ${String(ms).padStart(5)}ms  ~${Math.round(bytes/1024)}KB`);
};

for (const m of ['bulbul:v2', 'bulbul:v3']) {
  await bench(m, short, `short (${short.length} chars)`);
  await bench(m, long, `long (${long.length} chars)`);
}
