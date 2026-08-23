import 'dotenv/config';
import fs from 'node:fs';
const K = process.env.SARVAM_API_KEY;
const TEXT = 'Your four records do not agree. You can file the Joint Declaration yourself through DigiLocker, which takes about five working days.';

const wavInfo = (buf) => ({
  sampleRate: buf.readUInt32LE(24),
  bits: buf.readUInt16LE(34),
  seconds: +(buf.length / buf.readUInt32LE(28)).toFixed(2),
});

const run = async (label, body) => {
  const t = Date.now();
  const r = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: { 'api-subscription-key': K, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: TEXT, target_language_code: 'en-IN', ...body }),
  });
  const ms = Date.now() - t;
  if (!r.ok) return console.log(`${label.padEnd(34)} FAILED ${r.status} ${(await r.text()).slice(0,90)}`);
  const j = await r.json();
  const buf = Buffer.from(j.audios[0], 'base64');
  const i = wavInfo(buf);
  console.log(`${label.padEnd(34)} ${String(ms).padStart(5)}ms  ${String(i.sampleRate).padStart(5)}Hz  ${i.bits}bit  ${i.seconds}s  ${Math.round(buf.length/1024)}KB`);
  return { buf, label };
};

console.log('label                                 time    rate  depth  dur   size');
await run('v2 default (no params)', { model: 'bulbul:v2' });
await run('v2 @22050', { model: 'bulbul:v2', speech_sample_rate: 22050 });
const best = await run('v2 @24000 anushka', { model: 'bulbul:v2', speech_sample_rate: 24000, speaker: 'anushka' });
await run('v2 @44100 anushka', { model: 'bulbul:v2', speech_sample_rate: 44100, speaker: 'anushka' });
await run('v3 @24000', { model: 'bulbul:v3', speech_sample_rate: 24000 });
if (best) fs.writeFileSync(process.env.SHOT_OUT + '/tts-sample.wav', best.buf);
