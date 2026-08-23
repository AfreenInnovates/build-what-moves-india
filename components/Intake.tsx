'use client';

import { useState } from 'react';

/**
 * The intake, one question per screen. This replaces the seven competing entry
 * points on the EPFO login page: rather than asking you to know which door you
 * need, it works it out from what you can actually answer.
 */
interface Q {
  key: string;
  question: string;
  why: string;
  epfo: string;
  options: { value: string; label: string; hint?: string }[];
}

const QUESTIONS: Q[] = [
  {
    key: 'uanActive',
    question: 'Have you activated your UAN?',
    why: 'Until this is done, nothing else on EPFO works — no passbook, no transfers, no claims.',
    epfo: 'EPFO never asks this. It simply refuses to show you anything and does not say why.',
    options: [
      { value: 'yes', label: 'Yes, I can log in and see my passbook' },
      { value: 'no', label: 'No, or I have never tried' },
      { value: 'unsure', label: "I'm not sure", hint: 'We will assume no' },
    ],
  },
  {
    key: 'employment',
    question: 'Are you still working at that company?',
    why: 'This decides whether you can withdraw at all, or only take an advance.',
    epfo: 'EPFO asks you to pick a form that already assumes you know the answer to this.',
    options: [
      { value: 'working', label: 'Still working there' },
      { value: 'left', label: 'I have left' },
      { value: 'retired', label: 'I have retired' },
    ],
  },
  {
    key: 'tenure',
    question: 'How long were you there in total?',
    why: 'Under five years the withdrawal is taxable. Over ten, your pension stops being a lump sum.',
    epfo: 'Neither threshold is mentioned anywhere on the claim screen.',
    options: [
      { value: 'under5', label: 'Under 5 years', hint: 'Form 15G will apply' },
      { value: '5to10', label: 'Between 5 and 10 years' },
      { value: 'over10', label: 'Over 10 years', hint: 'Pension, not a lump sum' },
    ],
  },
  {
    key: 'balance',
    question: 'Roughly how much is in the account?',
    why: 'Above ₹50,000 with under five years of service, tax is deducted unless you attach Form 15G.',
    epfo: 'You find out about this requirement only once you are already filing.',
    options: [
      { value: 'under50k', label: 'Under ₹50,000' },
      { value: '50kto2l', label: '₹50,000 to ₹2 lakh' },
      { value: 'over2l', label: 'Over ₹2 lakh' },
      { value: 'unsure', label: "I don't know", hint: 'Missed call 9966044425 tells you by SMS' },
    ],
  },
  {
    key: 'nomination',
    question: 'Have you filed an e-nomination?',
    why: 'Without it the claim page will not open at all. It takes one day and blocks everything.',
    epfo: 'This is buried under Manage, and the claim page gives no reason when it refuses to load.',
    options: [
      { value: 'yes', label: 'Yes, it is filed' },
      { value: 'no', label: 'No' },
      { value: 'unsure', label: "I don't know", hint: 'We will assume no' },
    ],
  },
  {
    key: 'recordsMatch',
    question: 'Do your Aadhaar, PAN and bank records show exactly the same name?',
    why: 'One character of difference is the single most common reason claims are rejected.',
    epfo: 'Nothing on the portal compares them. You find out twenty days later.',
    options: [
      { value: 'yes', label: 'Yes, character for character' },
      { value: 'no', label: 'No, at least one differs' },
      { value: 'unsure', label: "I have not checked", hint: 'We will assume a mismatch' },
    ],
  },
  {
    key: 'employer',
    question: 'Can you still reach your previous employer?',
    why: 'This decides between a 10-day employer correction and a 21-day paper Joint Declaration.',
    epfo: 'The portal offers only one route and never mentions the other exists.',
    options: [
      { value: 'contactable', label: 'Yes, HR responds', hint: 'Fastest route' },
      { value: 'unresponsive', label: 'They exist but do not reply' },
      { value: 'closed', label: 'The company has shut down', hint: 'Joint Declaration route' },
    ],
  },
];

export function Intake({ action }: { action: (fd: FormData) => void }) {
  const [step, setStep] = useState(-1);
  const [name, setName] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const total = QUESTIONS.length;
  const q = QUESTIONS[step];

  if (step === -1) {
    return (
      <div>
        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-teal-600">
          Before we start
        </p>
        <h1 className="mt-2 text-[34px] leading-[1.12] font-bold tracking-tight text-ink-900">
          Seven questions. Then we show you what is actually blocking you.
        </h1>
        <p className="mt-4 max-w-[62ch] text-[16.5px] leading-relaxed text-ink-700">
          Nothing here is verified against EPFO — there is no public API and this is a demonstration.
          What it does show is the shape of the thing: the same answers you already have in your head
          are enough to work out which gates apply to you and in what order.
        </p>

        <label className="mt-8 block text-[15px] font-semibold text-ink-800">
          What should we call this case?
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Any name will do"
            className="mt-2 w-full max-w-[380px] rounded-sm border-2 border-ink-100 bg-white px-3.5 py-2.5 text-[16px] outline-none focus:border-teal-700"
          />
        </label>
        <p className="mt-1.5 text-[13px] text-ink-500">
          Not checked against anything. Use a made-up name if you prefer.
        </p>

        <button
          onClick={() => setStep(0)}
          className="mt-7 rounded-sm bg-teal-700 px-7 py-3 text-[16px] font-bold text-white transition hover:bg-teal-600"
        >
          Start
        </button>
      </div>
    );
  }

  if (step >= total) {
    return (
      <form action={action}>
        <input type="hidden" name="name" value={name} />
        {QUESTIONS.map((x) => (
          <input key={x.key} type="hidden" name={x.key} value={answers[x.key] ?? 'unsure'} />
        ))}

        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-teal-600">
          That is everything
        </p>
        <h1 className="mt-2 text-[32px] leading-[1.12] font-bold tracking-tight text-ink-900">
          Here is what you told us
        </h1>

        <dl className="mt-7 divide-y divide-ink-100 rounded-md border-2 border-ink-100 bg-white">
          {QUESTIONS.map((x) => (
            <div key={x.key} className="flex flex-wrap justify-between gap-2 px-4 py-3">
              <dt className="text-[14.5px] text-ink-700">{x.question}</dt>
              <dd className="text-[14.5px] font-semibold text-ink-900">
                {x.options.find((o) => o.value === answers[x.key])?.label ?? 'Not answered'}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 rounded-sm border-l-4 border-wait bg-wait-soft px-4 py-3 text-[14px] leading-relaxed text-ink-800">
          Anywhere you said you were not sure, we assume the answer that blocks you. An estimate that
          is too optimistic is worse than no estimate, because you would plan around it.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <button className="rounded-sm bg-teal-700 px-7 py-3 text-[16px] font-bold text-white transition hover:bg-teal-600">
            Build my case
          </button>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="rounded-sm border-2 border-ink-100 bg-white px-6 py-3 text-[16px] font-semibold text-ink-700 transition hover:border-ink-300"
          >
            Start over
          </button>
        </div>
      </form>
    );
  }

  const choose = (value: string) => {
    setAnswers((a) => ({ ...a, [q.key]: value }));
    setStep(step + 1);
  };

  return (
    <div>
      <div className="flex gap-1.5">
        {QUESTIONS.map((x, i) => (
          <span
            key={x.key}
            className={`h-1.5 flex-1 rounded-xs ${
              i < step ? 'bg-go' : i === step ? 'bg-signal' : 'bg-ink-100'
            }`}
          />
        ))}
      </div>
      <p className="tabular mt-2.5 text-[13px] font-semibold text-ink-500">
        Question {step + 1} of {total}
      </p>

      <h1 className="mt-5 text-[30px] leading-[1.15] font-bold tracking-tight text-ink-900">
        {q.question}
      </h1>
      <p className="mt-3 max-w-[60ch] text-[16px] leading-relaxed text-ink-700">{q.why}</p>

      <div className="mt-7 space-y-2.5">
        {q.options.map((o) => (
          <button
            key={o.value}
            onClick={() => choose(o.value)}
            className="flex w-full items-center justify-between gap-4 rounded-sm border-2 border-ink-100 bg-white px-4 py-4 text-left transition hover:border-teal-700 hover:bg-teal-50"
          >
            <span className="text-[16.5px] font-medium text-ink-900">{o.label}</span>
            {o.hint && (
              <span className="shrink-0 rounded-full bg-ink-50 px-2.5 py-1 text-[12px] font-semibold text-ink-500">
                {o.hint}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-7 rounded-sm border-l-4 border-stop bg-stop-soft px-4 py-3">
        <p className="text-[12.5px] font-bold uppercase tracking-[0.08em] text-stop">
          On EPFO today
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-800">{q.epfo}</p>
      </div>

      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          className="mt-6 text-[14.5px] font-semibold text-teal-700 hover:underline"
        >
          ← Previous question
        </button>
      )}
    </div>
  );
}
