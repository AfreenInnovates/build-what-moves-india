import 'dotenv/config';
const K = process.env.SARVAM_API_KEY;
const TEXT = 'Your four records do not agree, so any claim you file will be rejected.'; // 70 chars

const run = async (model, speaker, n = 6) => {
  const ts = [];
  for (let i = 0; i < n; i++) {
    const t = Date.now();
    const r = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: { 'api-subscription-key': K, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: TEXT, target_language_code: 'en-IN', model, speaker, speech_sample_rate: 24000 }),
    });
    if (!r.ok) { console.log(`${model}/${speaker} FAILED ${r.status}`); return; }
    await r.json();
    ts.push(Date.now() - t);
  }
  const sorted = [...ts].sort((a, b) => a - b);
  console.log(
    `${(model + ' / ' + speaker).padEnd(22)} median ${String(sorted[Math.floor(n/2)]).padStart(5)}ms   ` +
    `best ${String(sorted[0]).padStart(4)}  worst ${String(sorted[n-1]).padStart(5)}   [${ts.join(', ')}]`
  );
};

console.log('same 70-char line, six runs each\n');
await run('bulbul:v3', 'ritu');
await run('bulbul:v2', 'anushka');
await run('bulbul:v2', 'vidya');
await run('bulbul:v3', 'ritu');
