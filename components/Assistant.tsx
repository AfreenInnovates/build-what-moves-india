'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { chunkForSpeech, recordWav, type WavRecorder } from './audio';
import { LANGUAGE_NATIVE } from '@/lib/language';


interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * A stop on the tour. It carries the page it lives on and what to ring once
 * that page is up, so the tour can walk across the whole site rather than
 * pointing at whatever happens to be on screen.
 */
type TourStep = {
  target: string;
  say: string;
  href: string;
  selector: string;
  label: string | null;
};

const SUGGESTIONS = [
  'Walk me through the whole thing',
  'What should I do first?',
  'Why is my claim stuck?',
  'मेरा दावा क्यों अटका है?',
];

export function Assistant({
  member,
}: {
  member: { name: string; uan: string; employer: string; totalDays: number };
}) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loadedHistory, setLoadedHistory] = useState(false);
  const [input, setInput] = useState('');
  const [interim, setInterim] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [refining, setRefining] = useState(false);

  // Whatever language they last used. Sarvam has to be told which language to
  // speak, and getting it wrong is worse than silence - English phonemes
  // reading Devanagari is not something anybody can listen to.
  const langRef = useRef('en-IN');

  const router = useRouter();
  const pathname = usePathname();

  const [tour, setTour] = useState<TourStep[] | null>(null);
  const [tourAt, setTourAt] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakAbortRef = useRef<AbortController | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const wavRef = useRef<WavRecorder | null>(null);
  const refineRef = useRef<((b: Blob) => void) | null>(null);

  const firstName = member.name.split(' ')[0];

  /** What is actually in the box, settled words plus whatever is still being said. */
  const composed = (input + (interim ? (input ? ' ' : '') + interim : '')).trim();

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [msgs, busy]);

  // the conversation belongs to the case, so it survives a refresh
  useEffect(() => {
    if (!open || loadedHistory) return;
    setLoadedHistory(true);
    fetch('/api/assistant/history')
      .then((r) => r.json())
      .then((j) => j.messages?.length && setMsgs(j.messages))
      .catch(() => {});
  }, [open, loadedHistory]);

  // the box grows with its contents instead of scrolling inside one line
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, [input, interim, open]);

  // ---------------------------------------------------------------- speaking
  const stopSpeech = useCallback(() => {
    speakAbortRef.current?.abort();
    speakAbortRef.current = null;
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const fetchClip = useCallback(async (text: string, signal: AbortSignal) => {
    const r = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: langRef.current }),
      signal,
    });
    const j = await r.json();
    return j.audio as string | null;
  }, []);

  /**
   * Speaks the first sentence as soon as it is ready and fetches the rest while
   * that plays. Sarvam answers a short line in about a second but takes four or
   * more for a paragraph, so sending the whole reply at once meant the panel
   * said "speaking" and then sat silent.
   */
  const speak = useCallback(
    async (text: string) => {
      if (muted || !text) return;
      stopSpeech();

      const controller = new AbortController();
      speakAbortRef.current = controller;
      const parts = chunkForSpeech(text);
      setSpeaking(true);

      try {
        let next = fetchClip(parts[0], controller.signal);

        for (let i = 0; i < parts.length; i++) {
          const b64 = await next;
          if (controller.signal.aborted) return;
          // start the following clip downloading while this one plays
          next =
            i + 1 < parts.length
              ? fetchClip(parts[i + 1], controller.signal)
              : Promise.resolve(null);

          if (!b64) {
            if (i === 0 && typeof speechSynthesis !== 'undefined') {
              const u = new SpeechSynthesisUtterance(text);
              u.lang = langRef.current;
              u.rate = 1.02;
              u.onend = () => setSpeaking(false);
              speechSynthesis.speak(u);
              return;
            }
            continue;
          }

          const a = new Audio(`data:audio/wav;base64,${b64}`);
          audioRef.current = a;
          await new Promise<void>((resolve) => {
            a.onended = () => resolve();
            a.onerror = () => resolve();
            a.play().catch(() => resolve());
          });
          if (controller.signal.aborted) return;
        }
      } catch {
        /* aborted or offline */
      } finally {
        if (!controller.signal.aborted) setSpeaking(false);
      }
    },
    [muted, stopSpeech, fetchClip],
  );

  // ---------------------------------------------------------------- listening
  const stopListening = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    const wav = wavRef.current;
    wavRef.current = null;
    wav?.stop().then((blob) => blob && refineRef.current?.(blob));
    setListening(false);
    setInterim('');
  }, []);

  /**
   * Sarvam gets the last word, literally. The browser engine drives the live
   * display because Sarvam's API only answers once you stop talking - but the
   * browser is poor at Indian names and code-mixed speech, so what finally lands
   * in the box is Sarvam's transcript whenever it returns one.
   */
  const refineWithSarvam = useCallback(async (blob: Blob) => {
    if (blob.size < 2000) return;
    setRefining(true);
    try {
      const fd = new FormData();
      fd.append('audio', blob, 'speech.wav');
      fd.append('language', 'unknown');
      const r = await fetch('/api/listen', { method: 'POST', body: fd });
      const j = await r.json();
      if (j.transcript?.trim()) setInput(j.transcript.trim());
      // Sarvam tells us which language it just heard, which is a far better
      // signal than guessing from the text after the fact
      if (/^[a-z]{2}-[A-Z]{2}$/.test(j.language ?? '')) langRef.current = j.language;
    } catch {
      /* keep whatever the browser heard */
    } finally {
      setRefining(false);
    }
  }, []);

  refineRef.current = refineWithSarvam;

  const listen = useCallback(() => {
    if (listening) return stopListening();

    type Res = { isFinal: boolean; 0: { transcript: string } };
    type SR = new () => {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      start: () => void;
      stop: () => void;
      onresult: ((e: { resultIndex: number; results: ArrayLike<Res> }) => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
    };
    const w = window as unknown as {
      SpeechRecognition?: SR;
      webkitSpeechRecognition?: SR;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setMsgs((m) => [
        ...m,
        {
          role: 'assistant',
          content: 'Your browser will not let me listen. Chrome or Edge will.',
        },
      ]);
      return;
    }

    const rec = new Ctor();
    rec.lang = langRef.current;
    rec.continuous = true;
    rec.interimResults = true;

    let settled = '';
    rec.onresult = (e) => {
      let pending = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) settled += res[0].transcript;
        else pending += res[0].transcript;
      }
      setInput(settled.trim());
      setInterim(pending);
    };
    const finish = () => {
      setListening(false);
      setInterim('');
      recRef.current = null;
    };
    rec.onend = finish;
    rec.onerror = finish;

    recRef.current = rec;
    setListening(true);
    rec.start();

    // capture the same audio as WAV, which is what Sarvam accepts
    recordWav()
      .then((rec) => {
        wavRef.current = rec;
      })
      .catch(() => {
        /* browser transcript only */
      });
  }, [listening, stopListening]);

  // ------------------------------------------------------------------- asking
  const stopEverything = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    stopSpeech();
    setBusy(false);
  }, [stopSpeech]);

  const ask = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || busy) return;
      recRef.current?.stop();
      wavRef.current?.stop().then((blob) => blob && refineWithSarvam(blob));
      wavRef.current = null;
      stopSpeech();
      setInput('');
      setInterim('');
      setMsgs((m) => [...m, { role: 'user', content: q }]);
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const r = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: q }),
          signal: controller.signal,
        });
        const j = await r.json();
        if (typeof j.lang === 'string' && /^[a-z]{2}-[A-Z]{2}$/.test(j.lang))
          langRef.current = j.lang;
        setMsgs((m) => [...m, { role: 'assistant', content: j.reply }]);
        if (j.tour?.length) {
          setTour(j.tour);
          setTourAt(0);
          setOpen(false);
        } else {
          speak(j.reply);
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setMsgs((m) => [
            ...m,
            {
              role: 'assistant',
              content: 'Something went wrong reaching me. Try again?',
            },
          ]);
        }
      } finally {
        abortRef.current = null;
        setBusy(false);
      }
    },
    [busy, speak, stopSpeech],
  );

  // --------------------------------------------------------------------- tour
  /**
   * Each step may live on a different page, so the tour drives the router. The
   * ring is drawn by the overlay once the element it wants actually exists -
   * navigation is not instant and the old code pointed at nothing when a step
   * crossed a page boundary.
   */
  useEffect(() => {
    if (!tour) return;
    const step = tour[tourAt];
    if (!step) return;
    if (step.href && window.location.pathname !== step.href) router.push(step.href);
    // deliberately keyed on the step alone: re-running when the new page
    // arrives would start the narration over a second time
    speak(step.say);
  }, [tour, tourAt, speak, router]);

  const endTour = useCallback(() => {
    setTour(null);
    setTourAt(0);
    stopSpeech();
  }, [stopSpeech]);

  return (
    <>
      {tour && (
        <TourOverlay
          step={tour[tourAt]}
          index={tourAt}
          total={tour.length}
          here={pathname}
          speaking={speaking}
          onHush={stopSpeech}
          onNext={() => (tourAt + 1 < tour.length ? setTourAt(tourAt + 1) : endTour())}
          onPrev={() => setTourAt(Math.max(0, tourAt - 1))}
          onClose={endTour}
        />
      )}

      {!open && !tour && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full bg-teal-700 py-3 pl-3.5 pr-5 text-white shadow-lg transition hover:bg-teal-600"
        >
          <Orb small />
          <span className="text-[14.5px] font-semibold">Ask Saathi</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-0 right-0 z-40 flex h-[min(640px,90vh)] w-full flex-col border-t border-ink-100 bg-white shadow-2xl sm:bottom-5 sm:right-5 sm:w-[410px] sm:rounded-md sm:border">
          <header className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Orb small pulsing={busy || speaking} />
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-ink-900">Saathi</p>
                <p className="truncate text-[12px] text-ink-500">
                  {busy ? 'thinking…' : speaking ? 'speaking…' : 'here to help with your claim'}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {speaking && (
                <button
                  onClick={stopSpeech}
                  className="rounded-sm px-2 py-1 text-[12.5px] font-semibold text-signal hover:bg-signal-soft"
                >
                  Stop voice
                </button>
              )}
              <button
                onClick={() => {
                  setMuted(!muted);
                  stopSpeech();
                }}
                aria-pressed={!muted}
                title={muted ? 'Voice is off - turn it on' : 'Voice is on - turn it off'}
                className={`flex min-h-[34px] items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-bold transition ${
                  muted
                    ? 'bg-ink-100 text-ink-700 hover:bg-ink-300/60'
                    : 'bg-teal-700 text-white hover:bg-teal-600'
                }`}
              >
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path
                    d="M4 7.5h3L11 4v12L7 12.5H4z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                  {muted ? (
                    <path
                      d="M14 7.5l4 5M18 7.5l-4 5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  ) : (
                    <>
                      <path
                        d="M13.8 7.2a4 4 0 0 1 0 5.6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                      <path
                        d="M16.1 5.2a7 7 0 0 1 0 9.6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </>
                  )}
                </svg>
                {muted ? 'Voice off' : 'Voice on'}
              </button>
              <button
                onClick={() => {
                  stopEverything();
                  setOpen(false);
                }}
                className="rounded-sm px-2.5 py-1 text-[18px] leading-none text-ink-500 hover:bg-ink-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.length === 0 && (
              <div>
                <p className="text-[15px] leading-relaxed text-ink-700">
                  Hello {firstName}. Your money is{' '}
                  <span className="font-semibold text-ink-900">
                    {member.totalDays} working days
                  </span>{' '}
                  away. Ask me anything about what is holding it up - by typing, or by tapping
                  the mic and just saying it.
                </p>

                <div className="mt-4 rounded-md border border-ink-100 bg-ink-50 px-3.5 py-3">
                  <p className="text-[12px] font-bold uppercase tracking-[0.07em] text-ink-500">
                    Ask in your own language
                  </p>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-700">
                    {Object.values(LANGUAGE_NATIVE).join(' · ')}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
                    Speak or type in any of these and I answer in the same one. Switch whenever you
                    like - the language of your last message is the one I follow.
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      className="block w-full rounded-sm border border-ink-100 px-3 py-2.5 text-left text-[14px] text-ink-700 transition hover:border-teal-700 hover:bg-teal-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[88%] whitespace-pre-wrap rounded-md px-3.5 py-2.5 text-[14.5px] leading-relaxed ${
                  m.role === 'user' ? 'ml-auto bg-teal-700 text-white' : 'bg-ink-50 text-ink-800'
                }`}
              >
                {m.content}
              </div>
            ))}

            {busy && (
              <div className="flex items-center gap-2 text-[14px] text-ink-500">
                <Orb small pulsing />
                thinking…
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(composed);
            }}
            className="border-t border-ink-100 px-3 py-3"
          >
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={listen}
                className={`shrink-0 rounded-full p-2.5 transition ${
                  listening ? 'bg-signal text-white' : 'bg-ink-50 text-ink-700 hover:bg-ink-100'
                }`}
                aria-label={listening ? 'Stop listening' : 'Speak your question'}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <rect x="7" y="2" width="6" height="10" rx="3" />
                  <path
                    d="M4 9a6 6 0 0 0 12 0M10 15v3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              <textarea
                ref={boxRef}
                rows={1}
                value={composed}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    ask(composed);
                  }
                }}
                placeholder={listening ? 'Listening - start speaking' : 'Ask about your claim'}
                className={`min-w-0 flex-1 resize-none rounded-sm border px-3 py-2.5 text-[15px] leading-snug outline-none focus:border-teal-700 ${
                  listening ? 'border-signal bg-signal-soft' : 'border-ink-100'
                }`}
              />

              {busy ? (
                <button
                  type="button"
                  onClick={stopEverything}
                  className="shrink-0 rounded-sm bg-ink-800 p-2.5 text-white transition hover:bg-ink-900"
                  aria-label="Stop generating"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                    <rect x="3" y="3" width="10" height="10" rx="1.5" fill="currentColor" />
                  </svg>
                </button>
              ) : (
                <button
                  disabled={!composed}
                  className="shrink-0 rounded-sm bg-teal-700 px-4 py-2.5 text-[14px] font-bold text-white transition hover:bg-teal-600 disabled:opacity-40"
                >
                  Ask
                </button>
              )}
            </div>

            {!listening && !refining && (
              <p className="mt-1.5 pl-12 text-[11.5px] leading-snug text-ink-400">
                Type or speak, in any of {Object.keys(LANGUAGE_NATIVE).length} languages
              </p>
            )}

            {refining && !listening && (
              <p className="mt-1.5 pl-12 text-[11.5px] font-semibold text-teal-700">
                checking what you said with Sarvam…
              </p>
            )}

            {listening && (
              <p className="mt-1.5 flex items-center gap-1.5 pl-12 text-[11.5px] font-semibold text-signal">
                <span className="flex gap-0.5" aria-hidden>
                  <Bar d={0} />
                  <Bar d={120} />
                  <Bar d={240} />
                </span>
                {interim ? 'hearing you…' : 'listening'} · tap the mic to stop
              </p>
            )}
          </form>
        </div>
      )}
    </>
  );
}

function TourOverlay({
  step,
  index,
  total,
  here,
  speaking,
  onHush,
  onNext,
  onPrev,
  onClose,
}: {
  step?: TourStep;
  index: number;
  total: number;
  here: string;
  speaking: boolean;
  onHush: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  /**
   * The ring is stored with the step it belongs to. Keying it that way means a
   * stale ring from the previous page simply stops being rendered when the step
   * changes, instead of having to be cleared - and clearing it would mean
   * setting state from inside the effect that draws it.
   */
  const [ring, setRing] = useState<{ key: string; box: DOMRect } | null>(null);
  const key = step ? `${index}:${step.target}` : '';

  /**
   * Poll for the element rather than waiting a fixed moment. A step on another
   * page is not there when the step changes; it arrives when the route does,
   * which might be 80ms or might be a second on a route being reached for the
   * first time.
   */
  useEffect(() => {
    if (!step) return;

    const el = () =>
      document.querySelector(step.selector) ??
      document.querySelector(`[data-gate="${step.target}"]`);

    const measure = () => {
      const found = el();
      if (!found) return false;
      const box = found.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) return false;
      setRing({ key, box });
      return true;
    };

    let settled = false;
    const attempt = () => {
      if (settled) return;
      if (!measure()) return;
      settled = true;
      el()?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    attempt();

    const poll = window.setInterval(attempt, 120);
    // give up quietly after three seconds; the bubble still reads fine alone
    const giveUp = window.setTimeout(() => window.clearInterval(poll), 3000);

    const track = () => settled && measure();
    window.addEventListener('scroll', track, { passive: true });
    window.addEventListener('resize', track);
    return () => {
      window.clearInterval(poll);
      window.clearTimeout(giveUp);
      window.removeEventListener('scroll', track);
      window.removeEventListener('resize', track);
    };
  }, [step, key, here]);

  const box = ring?.key === key ? ring.box : null;

  if (!step) return null;

  return (
    <>
      {box && (
        <div
          className="pointer-events-none fixed z-40 rounded-md ring-4 ring-signal transition-all duration-500"
          style={{
            top: box.top - 6,
            left: box.left - 6,
            width: box.width + 12,
            height: box.height + 12,
            boxShadow: '0 0 0 9999px rgba(16,22,28,0.55)',
          }}
        />
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t-4 border-signal bg-white px-5 py-4 shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[420px] sm:rounded-md sm:border">
        <div className="flex items-start gap-3">
          <Orb pulsing={speaking} />
          <div className="min-w-0 flex-1">
            <p className="tabular text-[12px] font-bold uppercase tracking-[0.08em] text-signal">
              {index + 1} of {total} · {step.label ?? step.target}
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink-800">{step.say}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="text-[13.5px] font-semibold text-ink-500 hover:underline"
            >
              Stop tour
            </button>
            {speaking && (
              <button
                onClick={onHush}
                className="text-[13.5px] font-semibold text-signal hover:underline"
              >
                Stop voice
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {index > 0 && (
              <button
                onClick={onPrev}
                className="rounded-sm border-2 border-ink-100 px-4 py-2 text-[14px] font-semibold text-ink-700"
              >
                Back
              </button>
            )}
            <button
              onClick={onNext}
              className="rounded-sm bg-teal-700 px-5 py-2 text-[14px] font-bold text-white hover:bg-teal-600"
            >
              {index + 1 === total ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Bar({ d }: { d: number }) {
  return (
    <span
      className="inline-block w-[3px] rounded-full bg-signal"
      style={{ height: 11, animation: `vu 760ms ${d}ms ease-in-out infinite` }}
    />
  );
}

function Orb({ small = false, pulsing = false }: { small?: boolean; pulsing?: boolean }) {
  const s = small ? 22 : 30;
  return (
    <span className={`relative inline-flex shrink-0 ${pulsing ? 'animate-pulse' : ''}`}>
      <svg width={s} height={s} viewBox="0 0 40 40" aria-hidden>
        <defs>
          <radialGradient id="orbg" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#a8d8dc" />
            <stop offset="55%" stopColor="#098585" />
            <stop offset="100%" stopColor="#04404c" />
          </radialGradient>
        </defs>
        <circle cx="20" cy="20" r="17" fill="url(#orbg)" />
        <ellipse cx="14" cy="13" rx="6" ry="4" fill="#fff" opacity="0.32" />
      </svg>
    </span>
  );
}
