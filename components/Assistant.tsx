'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface GateInfo {
  id: string;
  title: string;
  status: string;
  blocks: string;
  actor: string | null;
  latencyDays: number;
  routeLabel: string | null;
  onCriticalPath: boolean;
}

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

type TourStep = { gateId: string; say: string };

const SUGGESTIONS = [
  'Show me what each gate means',
  'What should I do first?',
  'Why is my claim stuck?',
  'What documents do I need?',
];

export function Assistant({
  member,
  gates,
}: {
  member: { name: string; uan: string; employer: string; totalDays: number };
  gates: GateInfo[];
}) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);

  const [tour, setTour] = useState<TourStep[] | null>(null);
  const [tourAt, setTourAt] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const firstName = member.name.split(' ')[0];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, busy]);

  // ---------------------------------------------------------------- speaking
  const stopSpeech = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (muted || !text) return;
      stopSpeech();
      try {
        const r = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        const j = await r.json();
        if (j.audio) {
          const a = new Audio(`data:audio/wav;base64,${j.audio}`);
          audioRef.current = a;
          await a.play();
          return;
        }
      } catch {
        /* fall through to the browser's own voice */
      }
      if (typeof speechSynthesis !== 'undefined') {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.02;
        speechSynthesis.speak(u);
      }
    },
    [muted, stopSpeech],
  );

  // ---------------------------------------------------------------- listening
  const listen = useCallback(() => {
    type SR = new () => {
      lang: string;
      interimResults: boolean;
      start: () => void;
      stop: () => void;
      onresult: ((e: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
    };
    const w = window as unknown as { SpeechRecognition?: SR; webkitSpeechRecognition?: SR };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setMsgs((m) => [
        ...m,
        { role: 'assistant', content: 'Your browser will not let me listen. Chrome or Edge will.' },
      ]);
      return;
    }
    const rec = new Ctor();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.onresult = (e) => setInput(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  }, []);

  // ------------------------------------------------------------------- asking
  const ask = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || busy) return;
      setInput('');
      setMsgs((m) => [...m, { role: 'user', content: q }]);
      setBusy(true);
      try {
        const r = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: q, history: msgs.slice(-6) }),
        });
        const j = await r.json();
        setMsgs((m) => [...m, { role: 'assistant', content: j.reply }]);
        if (j.tour?.length) {
          setTour(j.tour);
          setTourAt(0);
          setOpen(false);
        } else {
          speak(j.reply);
        }
      } catch {
        setMsgs((m) => [
          ...m,
          { role: 'assistant', content: 'Something went wrong reaching me. Try again?' },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, msgs, speak],
  );

  // --------------------------------------------------------------------- tour
  useEffect(() => {
    if (!tour) return;
    const step = tour[tourAt];
    if (!step) return;
    const el = document.querySelector(`[data-gate="${step.gateId}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    speak(step.say);
  }, [tour, tourAt, speak]);

  const endTour = () => {
    setTour(null);
    setTourAt(0);
    stopSpeech();
  };

  return (
    <>
      {tour && (
        <TourOverlay
          step={tour[tourAt]}
          index={tourAt}
          total={tour.length}
          gate={gates.find((g) => g.id === tour[tourAt]?.gateId)}
          onNext={() => (tourAt + 1 < tour.length ? setTourAt(tourAt + 1) : endTour())}
          onPrev={() => setTourAt(Math.max(0, tourAt - 1))}
          onClose={endTour}
        />
      )}

      {/* launcher */}
      {!open && !tour && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full bg-teal-700 py-3 pl-3.5 pr-5 text-white shadow-lg transition hover:bg-teal-600"
        >
          <Orb small />
          <span className="text-[14.5px] font-semibold">Ask about your case</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-0 right-0 z-40 flex h-[min(620px,88vh)] w-full flex-col border-t border-ink-100 bg-white shadow-2xl sm:bottom-5 sm:right-5 sm:w-[400px] sm:rounded-md sm:border">
          <header className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Orb small />
              <div>
                <p className="text-[14.5px] font-bold text-ink-900">Your guide</p>
                <p className="text-[12px] text-ink-500">
                  Knows {firstName}&rsquo;s case only
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setMuted(!muted);
                  stopSpeech();
                }}
                className="rounded-sm px-2 py-1 text-[12.5px] font-semibold text-ink-500 hover:bg-ink-50"
              >
                {muted ? 'Voice off' : 'Voice on'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-sm px-2.5 py-1 text-[16px] text-ink-500 hover:bg-ink-50"
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
                  away. Ask me anything about what is holding it up — I only know about your case.
                </p>
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
                className={`max-w-[88%] rounded-md px-3.5 py-2.5 text-[14.5px] leading-relaxed ${
                  m.role === 'user'
                    ? 'ml-auto bg-teal-700 text-white'
                    : 'bg-ink-50 text-ink-800'
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
              ask(input);
            }}
            className="flex items-center gap-2 border-t border-ink-100 px-3 py-3"
          >
            <button
              type="button"
              onClick={listen}
              className={`shrink-0 rounded-full p-2.5 transition ${
                listening ? 'bg-signal text-white' : 'bg-ink-50 text-ink-700 hover:bg-ink-100'
              }`}
              aria-label="Speak your question"
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
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? 'Listening…' : 'Ask about your case'}
              className="min-w-0 flex-1 rounded-sm border border-ink-100 px-3 py-2.5 text-[15px] outline-none focus:border-teal-700"
            />
            <button
              disabled={busy || !input.trim()}
              className="shrink-0 rounded-sm bg-teal-700 px-4 py-2.5 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              Ask
            </button>
          </form>
        </div>
      )}
    </>
  );
}

/** The orb: highlights the gate being talked about and carries the caption. */
function TourOverlay({
  step,
  index,
  total,
  gate,
  onNext,
  onPrev,
  onClose,
}: {
  step?: TourStep;
  index: number;
  total: number;
  gate?: GateInfo;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  const [box, setBox] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!step) return;
    const find = () => {
      const el = document.querySelector(`[data-gate="${step.gateId}"]`);
      setBox(el ? el.getBoundingClientRect() : null);
    };
    const t = setTimeout(find, 420);
    window.addEventListener('scroll', find, { passive: true });
    window.addEventListener('resize', find);
    return () => {
      clearTimeout(t);
      window.removeEventListener('scroll', find);
      window.removeEventListener('resize', find);
    };
  }, [step]);

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
          <Orb pulsing />
          <div className="min-w-0 flex-1">
            <p className="tabular text-[12px] font-bold uppercase tracking-[0.08em] text-signal">
              {index + 1} of {total} · {gate?.title ?? step.gateId}
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink-800">{step.say}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-[13.5px] font-semibold text-ink-500 hover:underline"
          >
            Stop
          </button>
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
