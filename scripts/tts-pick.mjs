import 'dotenv/config';
import fs from 'node:fs';
const K = process.env.SARVAM_API_KEY;
const OUT = process.env.SHOT_OUT;
const TEXT = 'Your four records do not agree. You can file the Joint Declaration yourself through DigiLocker, which takes about five working days.';

const gen = async (model, speaker) => {
  const times = []; let buf;
  for (let i = 0; i < 3; i++) {
    const t = Date.now();
    const r = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: { 'api-subscription-key': K, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: TEXT, target_language_code: 'en-IN', model, speaker, speech_sample_rate: 24000 }),
    });
    if (!r.ok) { console.log(`${model}/${speaker} FAILED`); return; }
    times.push(Date.now() - t);
    buf = Buffer.from((await r.json()).audios[0], 'base64');
  }
  const med = times.sort((a,b)=>a-b)[1];
  const name = `voice-${model.split(':')[1]}-${speaker}.wav`;
  fs.writeFileSync(`${OUT}/${name}`, buf);
  console.log(`${(model.split(':')[1] + ' / ' + speaker).padEnd(20)} median ${String(med).padStart(5)}ms   ${name}`);
};

console.log('median of three runs\n');
for (const s of ['anushka', 'vidya']) await gen('bulbul:v2', s);
for (const s of ['ritu', 'priya', 'shreya', 'niharika']) await gen('bulbul:v3', s);
