'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { startFreshProfile } from '@/app/actions';
import { Icon, type IconName } from './Icon';
import { StepSequence } from './StepSequence';

interface StepDef {
  key: string;
  n: number;
  icon: IconName;
  title: string;
  hint: string;
}

const STEPS: StepDef[] = [
  { key: 'you', n: 1, icon: 'people', title: 'Your details', hint: 'On EPFO this comes from your Aadhaar. Here you just type it in.' },
  { key: 'job', n: 2, icon: 'employment', title: 'Your current employer', hint: 'On EPFO your employer registers you and generates your UAN.' },
  { key: 'docs', n: 3, icon: 'records', title: 'Your documents', hint: 'EPFO compares these four against each other. Upload the demo set and we will use them.' },
  { key: 'kyc', n: 4, icon: 'shield', title: 'Verify and create', hint: 'On EPFO this is Aadhaar OTP and KYC approval. We simulate it.' },
];

/**
 * The four records a claim is judged against, as files.
 *
 * Nobody should have to find a real Aadhaar scan to try a demonstration, and we
 * would not want them to. This mints a plausible set named after whatever they
 * typed, so the upload step is something you can actually complete - and so the
 * filenames on screen are theirs rather than a stranger's.
 */
const DEMO_DOCS = [
  { key: 'aadhaar', label: 'Aadhaar', file: 'aadhaar', kb: 412 },
  { key: 'pan', label: 'PAN card', file: 'pan-card', kb: 268 },
  { key: 'bank', label: 'Bank passbook', file: 'bank-passbook', kb: 530 },
  { key: 'epfo', label: 'EPFO profile', file: 'epfo-member-profile', kb: 194 },
] as const;

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'member';

const CREATE_STEPS = [
  { label: 'Verifying your Aadhaar', note: 'Simulated. Nothing is checked or stored.', ms: 520 },
  { label: 'Generating your UAN', note: 'A 12-digit number that follows you across jobs.', ms: 460 },
  { label: 'Setting up your passbook', note: 'On the real portal this takes 6 to 24 hours.', ms: 400 },
];

export function SignupWizard() {
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(-1);
  const [form, setForm] = useState({ name: '', dob: '', employer: '', joined: '' });
  const [docs, setDocs] = useState<{ name: string; kb: number; label: string }[]>([]);
  const [filling, setFilling] = useState(false);

  const fillDocs = async () => {
    if (filling) return;
    setFilling(true);
    const base = slug(form.name);
    // added one at a time, so it reads as four files arriving rather than a
    // list appearing from nowhere
    for (const d of DEMO_DOCS) {
      await new Promise((r) => setTimeout(r, 260));
      setDocs((prev) => [...prev, { name: `${d.file}-${base}.pdf`, kb: d.kb, label: d.label }]);
    }
    setFilling(false);
  };
  const formRef = useRef<HTMLFormElement>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const canNext =
    (step === 0 && form.name.trim().length > 1) ||
    (step === 1 && form.employer.trim().length > 1) ||
    (step === 2 && docs.length === DEMO_DOCS.length) ||
    step === 3;

  const create = async () => {
    for (let i = 0; i < CREATE_STEPS.length; i++) {
      setCreating(i);
      await new Promise((r) => setTimeout(r, CREATE_STEPS[i].ms));
    }
    formRef.current?.requestSubmit();
  };

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <Link href="/login" className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-semibold text-teal-700 hover:underline">
        <Icon name="back" size={16} aria-hidden /> Back to cases
      </Link>

      <div className="mt-4 mb-6">
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-teal-600">New profile</p>
        <h1 className="mt-1 text-[30px] font-bold tracking-tight text-ink-900">Set up your EPF profile</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-700">
          The minimum EPFO needs to know you, minus the friction. Three quick steps.
        </p>
      </div>

      {/* stepper */}
      <ol className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                i < step ? 'bg-go text-white' : i === step ? 'bg-teal-700 text-white' : 'bg-ink-100 text-ink-400'
              }`}
            >
              {i < step ? <Icon name="check" size={16} aria-hidden /> : s.n}
            </span>
            {i < STEPS.length - 1 && (
              <span className={`h-0.5 flex-1 rounded-full ${i < step ? 'bg-go' : 'bg-ink-100'}`} />
            )}
          </li>
        ))}
      </ol>

      <div className="relative rounded-xl border border-ink-100 bg-white p-6 shadow-[0_6px_24px_rgba(5,81,96,0.07)]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Icon name={STEPS[step].icon} size={20} aria-hidden />
          </span>
          <h2 className="text-[18px] font-bold text-ink-900">{STEPS[step].title}</h2>
        </div>
        <p className="mt-2 rounded-md border-l-4 border-teal-200 bg-teal-50 px-3 py-2 text-[13px] leading-relaxed text-teal-800">
          {STEPS[step].hint}
        </p>

        <div className="mt-5 space-y-4">
          {step === 0 && (
            <>
              <Input label="Full name" value={form.name} onChange={set('name')} placeholder="As it appears on Aadhaar" />
              <Input label="Date of birth" value={form.dob} onChange={set('dob')} type="date" />
            </>
          )}
          {step === 1 && (
            <>
              <Input label="Current employer" value={form.employer} onChange={set('employer')} placeholder="Company name" />
              <Input label="Date of joining" value={form.joined} onChange={set('joined')} type="date" />
            </>
          )}
          {step === 2 && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[14px] text-ink-700">
                  {docs.length === 0
                    ? 'Nothing uploaded yet.'
                    : `${docs.length} of ${DEMO_DOCS.length} uploaded.`}
                </p>
                <button
                  onClick={fillDocs}
                  disabled={filling || docs.length > 0}
                  className="inline-flex items-center gap-1.5 rounded-md border-2 border-teal-700 bg-white px-3.5 py-2 text-[13.5px] font-bold text-teal-700 transition hover:bg-teal-50 disabled:opacity-50"
                >
                  <Icon name="bolt" size={14} aria-hidden />
                  {filling ? 'Adding files' : 'Fill in demo documents'}
                </button>
              </div>

              <ul className="mt-3 space-y-2">
                {DEMO_DOCS.map((d, i) => {
                  const got = docs[i];
                  return (
                    <li
                      key={d.key}
                      className={`flex items-center gap-3 rounded-md border px-3.5 py-2.5 ${
                        got ? 'border-go/40 bg-go-soft/40' : 'border-dashed border-ink-200 bg-ink-50'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                          got ? 'bg-go text-white' : 'bg-white text-ink-400'
                        }`}
                      >
                        <Icon name={got ? 'check' : 'records'} size={16} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-semibold text-ink-900">
                          {d.label}
                        </span>
                        <span className="block truncate text-[12.5px] text-ink-500">
                          {got ? got.name : 'no file chosen'}
                        </span>
                      </span>
                      {got && (
                        <span className="tabular shrink-0 text-[12px] text-ink-500">{got.kb} KB</span>
                      )}
                    </li>
                  );
                })}
              </ul>

              <p className="mt-3 rounded-md border-l-4 border-wait bg-wait-soft px-3 py-2 text-[13px] leading-relaxed text-ink-800">
                These are generated for the demonstration and named after what you typed. Nothing is
                uploaded anywhere, no real document is read, and the identifiers inside them are
                deliberately invalid.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2 text-[14px] text-ink-700">
              <Review label="Name" value={form.name || 'not given'} />
              <Review label="Date of birth" value={form.dob || 'not given'} />
              <Review label="Employer" value={form.employer || 'not given'} />
              <Review label="Joined" value={form.joined || 'not given'} />
              <Review label="Documents" value={`${docs.length} uploaded`} />
              <p className="mt-2 rounded-md border-l-4 border-wait bg-wait-soft px-3 py-2 text-[13px] leading-relaxed text-ink-800">
                We will attach a set of synthetic records with one deliberate mismatch, so every
                section has something to explore.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || creating >= 0}
            className="rounded-md px-4 py-2.5 text-[14px] font-semibold text-ink-500 disabled:opacity-40"
          >
            Back
          </button>
          {step < 3 ? (
            <button
              onClick={() => canNext && setStep((s) => s + 1)}
              disabled={!canNext}
              className="card-hover rounded-md bg-teal-700 px-6 py-2.5 text-[14.5px] font-bold text-white hover:bg-teal-600 disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={create}
              disabled={creating >= 0}
              className="card-hover rounded-md bg-teal-700 px-6 py-2.5 text-[14.5px] font-bold text-white hover:bg-teal-600 disabled:opacity-70"
            >
              {creating >= 0 ? 'Creating…' : 'Create my profile'}
            </button>
          )}
        </div>

        <form ref={formRef} action={startFreshProfile} className="hidden">
          <input type="hidden" name="name" value={form.name} />
          <input type="hidden" name="dob" value={form.dob} />
          <input type="hidden" name="employer" value={form.employer} />
          <input type="hidden" name="joined" value={form.joined} />
        </form>

        {creating >= 0 && (
          <StepSequence
            title="Creating your profile"
            steps={CREATE_STEPS}
            stage={creating}
            footnote="Everything you entered is saved to the database, so this profile behaves exactly like the seeded demo cases."
          />
        )}
      </div>
    </div>
  );
}

function Input({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-ink-700">{label}</span>
      <input
        {...rest}
        className="mt-1.5 w-full rounded-md border-2 border-ink-100 bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-teal-700"
      />
    </label>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-ink-100 py-1.5">
      <span className="text-ink-500">{label}</span>
      <span className="font-semibold text-ink-900">{value}</span>
    </div>
  );
}
