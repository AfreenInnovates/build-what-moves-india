import 'dotenv/config';
const G = process.env.GROQ_API_KEY;
const SYS = 'You are a warm guide helping one person with their EPF claim. Reply as JSON: {"reply":"...","tour":null}. Two or three sentences, plain words.';
const Q = 'explain what is blocking my claim';

const bench = async (model) => {
  const times = [];
  for (let i = 0; i < 3; i++) {
    const t = Date.now();
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${G}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model, temperature: 0.3, max_tokens: 400,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: SYS }, { role: 'user', content: Q }],
      }),
    });
    if (!r.ok) { console.log(`${model.padEnd(26)} FAILED ${r.status}`); return; }
    await r.json();
    times.push(Date.now() - t);
  }
  times.sort((a, b) => a - b);
  console.log(`${model.padEnd(26)} median ${String(times[1]).padStart(5)}ms   (${times.join(', ')})`);
};

console.log('Groq reply latency, three runs each\n');
await bench('openai/gpt-oss-120b');
await bench('openai/gpt-oss-20b');
await bench('qwen/qwen3.6-27b');
await bench('groq/compound-mini');
