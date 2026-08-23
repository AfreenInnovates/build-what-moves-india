import 'dotenv/config';
import fs from 'node:fs';

const PROMPT = `Extract from this document image. Return ONLY strict JSON, no prose:
{"name":"","name_native":"","dob":"","father_name":"","id_number":"","account_number":"","ifsc":"","script":""}
Use "" for fields not present. Preserve native script exactly as printed in name_native.`;

for (const f of process.argv.slice(2)) {
  const b64 = fs.readFileSync(f).toString('base64');
  const mime = f.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
  const t0 = Date.now();
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL_VISION,
      messages: [{ role: 'user', content: [
        { type: 'text', text: PROMPT },
        { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } }] }],
      temperature: 0, max_tokens: 1200, reasoning_effort: "none", response_format: { type: "json_object" },
    }),
  });
  const j = await r.json();
  const txt = j.choices?.[0]?.message?.content ?? JSON.stringify(j).slice(0, 300);
  console.log(`\n=== ${f}  (${Date.now() - t0}ms) ===\n${txt.trim()}`);
}
