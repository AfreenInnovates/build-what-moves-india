'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { signIn } from '@/app/actions';
import { Icon } from './Icon';
import { StepSequence, type SequenceStep } from './StepSequence';

type Step = SequenceStep;

const PASSWORD_STEPS: Step[] = [
  { label: 'Checking the captcha', note: 'Accepted for you.', ms: 400 },
  { label: 'Sending OTP to your Aadhaar-linked mobile', note: 'Simulated. On EPFO this goes to your Aadhaar number, not the one HR has.', ms: 520 },
  { label: 'Verifying OTP', note: 'Verified.', ms: 380 },
  { label: 'Opening your case', note: 'Loading your record.', ms: 320 },
];

const OTP_STEPS: Step[] = [
  { label: 'Sending a one-time code to •••• 9003', note: 'The Aadhaar-linked mobile. No password, no captcha.', ms: 520 },
  { label: 'Verifying your code', note: 'One code and you are in.', ms: 420 },
  { label: 'Opening your case', note: 'Loading your record.', ms: 320 },
];

/**
 * The demo sign-in. It mirrors the EPFO login, then plays the steps we cannot
 * really perform, each labelled honestly. "Forgot password" is not a dead loop:
 * it reveals a passwordless one-time-code sign-in, which is the improvement over
 * the portal's UAN → Aadhaar → OTP → reset merry-go-round.
 */
export function DemoLogin({
  slug,
  name,
  uan,
  password,
}: {
  slug: string;
  name: string;
  uan: string;
  password: string;
}) {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [stage, setStage] = useState(-1);
  const [showForgot, setShowForgot] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const run = async (seq: Step[]) => {
    if (stage >= 0) return;
    setSteps(seq);
    for (let i = 0; i < seq.length; i++) {
      setStage(i);
      await new Promise((r) => setTimeout(r, seq[i].ms));
    }
    formRef.current?.requestSubmit();
  };

  const running = stage >= 0;

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-[0_8px_30px_rgba(5,81,96,0.08)]">
        <div className="flex items-center gap-2.5 bg-teal-800 px-5 py-3.5 text-white">
          <Icon name="shield" size={18} aria-hidden />
          <p className="text-[14.5px] font-bold">Member sign in</p>
          <span className="ml-auto rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold">demo</span>
        </div>

        <div className="space-y-4 px-5 py-5">
          <Field label="UAN" value={uan} mono />
          <Field label="Password" value={password} shown />
          <div>
            <label className="block text-[13px] font-semibold text-ink-700">Captcha</label>
            <div className="mt-1.5 flex items-center gap-2.5">
              <span
                className="select-none rounded-md bg-ink-50 px-4 py-2 font-mono text-[18px] font-bold text-ink-800"
                style={{ fontStyle: 'italic', letterSpacing: '0.3em', textDecoration: 'line-through' }}
              >
                7K4P9
              </span>
              <input readOnly value="7K4P9" aria-label="Captcha answer" className="w-28 rounded-md border border-ink-100 bg-ink-50 px-3 py-2 font-mono text-[15px] text-ink-700" />
              <span className="text-[11.5px] text-ink-400">filled for you</span>
            </div>
          </div>

          <form ref={formRef} action={signIn} className="hidden">
            <input type="hidden" name="slug" value={slug} />
          </form>

          <button
            onClick={() => run(PASSWORD_STEPS)}
            disabled={running}
            className="card-hover mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-teal-700 py-3 text-[15px] font-bold text-white hover:bg-teal-600 disabled:opacity-70"
          >
            {running ? 'Signing in…' : `Sign in as ${name.split(' ')[0]}`}
            {!running && <Icon name="route" size={17} aria-hidden />}
          </button>

          <button
            onClick={() => setShowForgot((v) => !v)}
            className={`flex w-full items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-[13.5px] font-semibold transition ${
              showForgot
                ? 'border-teal-700 bg-teal-50 text-teal-800'
                : 'border-dashed border-teal-300 bg-teal-50/40 text-teal-700 hover:bg-teal-50'
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-white">
              <Icon name="eye" size={13} aria-hidden />
            </span>
            Forgot password? See our better way
            <Icon name={showForgot ? 'up' : 'down'} size={15} className="ml-auto" aria-hidden />
          </button>

          {showForgot && (
            <div className="space-y-3 rounded-lg border border-ink-100 bg-ink-50 p-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-stop">On EPFO today</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink-700">
                  You verify UAN, then Aadhaar, then an OTP, then set a new password, and the page
                  often bounces you back to the start. People give up here.
                </p>
              </div>
              <div className="rounded-md border-l-4 border-teal-700 bg-white p-3.5">
                <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-teal-700">
                  <Icon name="phone" size={14} aria-hidden /> A better way, here
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink-800">
                  Skip the password entirely. We send a one-time code to the mobile linked to your
                  Aadhaar and sign you straight in. Nothing to remember, nothing to reset.
                </p>
                <button
                  onClick={() => run(OTP_STEPS)}
                  disabled={running}
                  className="card-hover mt-3 flex w-full items-center justify-center gap-2 rounded-md border-2 border-teal-700 bg-white py-2.5 text-[14px] font-bold text-teal-700 hover:bg-teal-700 hover:text-white disabled:opacity-60"
                >
                  <Icon name="phone" size={16} aria-hidden /> Sign in with a one-time code instead
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {running && steps && (
        <StepSequence
          title={steps === OTP_STEPS ? 'Signing you in with a one-time code' : `Signing in as ${name.split(' ')[0]}`}
          steps={steps}
          stage={stage}
          footnote="You would normally stay signed in until your session expires. This demo signs you out between accounts, so you can try all six people."
        />
      )}

      <div className="mt-5 text-center">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-500 hover:text-teal-700">
          <Icon name="back" size={15} aria-hidden /> Choose a different person
        </Link>
      </div>
    </div>
  );
}

function Field({ label, value, mono, shown }: { label: string; value: string; mono?: boolean; shown?: boolean }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-ink-700">{label}</label>
      <div className="mt-1.5 flex items-center gap-2">
        <input readOnly value={value} className={`flex-1 rounded-md border border-ink-100 bg-ink-50 px-3 py-2 text-[15px] text-ink-800 ${mono ? 'font-mono' : ''}`} />
        {shown && <span className="rounded-full bg-go-soft px-2.5 py-1 text-[11.5px] font-semibold text-go">shown for demo</span>}
      </div>
    </div>
  );
}
