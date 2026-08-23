import 'dotenv/config';
const K = process.env.SARVAM_API_KEY;
const say = async (text) => {
  const t = Date.now();
  const r = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: { 'api-subscription-key': K, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text, target_language_code: 'en-IN',
      model: process.env.SARVAM_TTS_MODEL, speaker: process.env.SARVAM_TTS_SPEAKER,
      speech_sample_rate: 24000,
    }),
  });
  const ms = Date.now() - t;
  console.log(`${String(text.length).padStart(4)} chars -> ${String(ms).padStart(5)}ms  ${r.ok ? '' : 'FAIL ' + r.status}`);
  return ms;
};
console.log('bulbul:v3 / ritu — latency against input length\n');
await say('Your records do not agree.');
await say('Your records do not agree. Your employer must raise the correction.');
await say('Your claim is blocked because your four records do not agree. You can file the Joint Declaration yourself through DigiLocker, which takes about five working days and needs no employer approval.');
await say('Your claim is blocked because your four records do not agree. You can file the Joint Declaration yourself through DigiLocker, which takes about five working days and needs no employer approval. After that the second UAN still has to be merged, and only then does the claim page open. The exit date is already recorded, so that part is done.');
