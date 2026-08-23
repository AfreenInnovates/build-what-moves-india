/**
 * Client-side audio helpers.
 *
 * Two problems solved here, both measured rather than assumed:
 *
 * 1. Sarvam's TTS latency is not linear. Under ~70 characters it answers in
 *    about 950ms; over ~190 it takes 4.4 seconds. Sending a whole paragraph
 *    means the panel says "speaking…" and then sits silent for seven seconds.
 *    So we cut the reply at sentence boundaries and speak the first piece while
 *    the rest is still being fetched.
 *
 * 2. Sarvam's ASR rejects `audio/webm;codecs=opus`, which is exactly what
 *    MediaRecorder produces in Chrome. It accepts wav, so we capture raw PCM
 *    through the Web Audio API and encode a WAV ourselves.
 */

/** Split into pieces small enough to stay in the fast band. */
export function chunkForSpeech(text: string, first = 90, rest = 220): string[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  const out: string[] = [];
  let buf = '';
  for (const s of sentences) {
    const cap = out.length === 0 ? first : rest;
    if (buf && (buf + ' ' + s).length > cap) {
      out.push(buf);
      buf = s;
    } else {
      buf = buf ? `${buf} ${s}` : s;
    }
  }
  if (buf) out.push(buf);
  return out.length ? out : [text];
}

export interface WavRecorder {
  stop: () => Promise<Blob | null>;
}

/** Records mono 16 kHz PCM and hands back a WAV blob, which Sarvam accepts. */
export async function recordWav(): Promise<WavRecorder | null> {
  if (!navigator.mediaDevices?.getUserMedia) return null;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });

  const AudioCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtor();
  const source = ctx.createMediaStreamSource(stream);
  const node = ctx.createScriptProcessor(4096, 1, 1);
  const frames: Float32Array[] = [];

  node.onaudioprocess = (e) => {
    frames.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  };
  source.connect(node);
  node.connect(ctx.destination);

  return {
    stop: async () => {
      node.disconnect();
      source.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      const rate = ctx.sampleRate;
      await ctx.close();

      const total = frames.reduce((n, f) => n + f.length, 0);
      if (total < rate * 0.3) return null; // under 300ms is not speech

      const merged = new Float32Array(total);
      let at = 0;
      for (const f of frames) {
        merged.set(f, at);
        at += f.length;
      }
      return encodeWav(downsample(merged, rate, 16000), 16000);
    },
  };
}

function downsample(input: Float32Array, from: number, to: number): Float32Array {
  if (to >= from) return input;
  const ratio = from / to;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    out[i] = sum / (end - start || 1);
  }
  return out;
}

function encodeWav(samples: Float32Array, rate: number): Blob {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buf);
  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };

  str(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let off = 44;
  for (let i = 0; i < samples.length; i++, off += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buf], { type: 'audio/wav' });
}
