import Link from 'next/link';

const ROWS = [
  ['EPFO member portal APIs', 'Mocked', 'There is no public API. Nothing here talks to EPFO.'],
  ['Employer portal', 'Mocked', 'Members cannot see it at all, so neither can we.'],
  ['UIDAI / Aadhaar verification', 'Mocked', 'No Aadhaar authentication, and no real Aadhaar number exists anywhere in this project.'],
  ['Bank account verification', 'Mocked', 'No penny-drop, no IFSC lookup.'],
  ['UMANG face authentication', 'Explained, not rebuilt', 'We walk you through it and set expectations. We cannot reimplement it and do not claim to.'],
  ['Claim filing and settlement', 'Mocked', 'No claim is filed anywhere. Marking a gate done updates your case, nothing else.'],
  ['Settlement timings', 'Estimated', 'Latencies come from published EPFO service standards and reporting, held in one config file. They are estimates, not guarantees.'],
  ['Documents', 'Synthetic', 'Every document is generated from a template, watermarked, and carries deliberately invalid identifiers.'],
  ['Member records', 'Synthetic', 'Two seeded demo members. No real person’s data is used.'],
  ['Gate logic', 'Real', 'The dependency graph, critical path and day counts are genuinely computed, unit-tested, and stored in Postgres.'],
  ['Case persistence', 'Real', 'Progress is written to Postgres and survives refresh, tab close, and returning days later.'],
] as const;

const SOURCES: [string, string][] = [
  [
    'About one in four claims rejected — roughly 26% in FY 2023-24',
    'Factly / Dataful analysis of EPFO claim data. Their five-year average is near 27%.',
  ],
  [
    'Final-settlement rejections rose from about 13% to about 34%',
    'Reporting on EPFO data covering FY 2017-18 to FY 2022-23. A narrower measure than the figure above, which is why the two differ — we quote the lower, broader one.',
  ],
  [
    'A clean, fully KYC-linked claim settles in about three working days',
    'EPFO auto-settlement, with the ceiling raised to Rs 5 lakh. This is the baseline the countdown counts down to.',
  ],
  [
    'An Aadhaar-verified member can file the Joint Declaration via DigiLocker',
    'EPFO route removing employer approval for name and date-of-birth corrections. EPFO publishes no turnaround, so the 5-day figure in the gate spec is labelled as our estimate, not a published standard.',
  ],
  [
    'Every other latency in the product',
    'Each one carries its source, the date it was last checked, and whether it is a published rule, a reported figure or our estimate. Open any gate and use "Why N days?" to see it.',
  ],
];

const TONE: Record<string, string> = {
  Real: 'bg-go-soft text-go',
  Mocked: 'bg-ink-50 text-ink-500',
  Synthetic: 'bg-ink-50 text-ink-500',
  Estimated: 'bg-wait-soft text-wait',
  'Explained, not rebuilt': 'bg-wait-soft text-wait',
};

export default function WhatsMocked() {
  return (
    <main className="mx-auto w-full max-w-[620px] px-5 pb-24 pt-12">
      <Link href="/" className="-ml-2 inline-flex min-h-[44px] items-center rounded-sm px-2 text-[14px] font-medium text-teal-700 transition hover:underline">
        ← Home
      </Link>

      <h1 className="mt-4 text-[28px] leading-tight font-bold tracking-tight text-ink-900">
        What is real and what is mocked
      </h1>
      <p className="mt-3 text-[15.5px] leading-relaxed text-ink-700">
        This is linked from every page rather than buried, because a tool that handles identity
        documents should be unambiguous about what it does and does not touch.
      </p>

      <div className="mt-8 space-y-2">
        {ROWS.map(([what, status, detail]) => (
          <div key={what} className="rounded-md border border-ink-100 bg-white px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[15px] font-medium text-ink-900">{what}</p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TONE[status]}`}
              >
                {status}
              </span>
            </div>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-700">{detail}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-md border border-signal/25 bg-signal-soft px-4 py-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-signal">
          Please do not upload real documents
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-900">
          If you try this with your own files, they are sent to a third-party OCR service to be read.
          They are not stored, but they do leave this machine. Use the synthetic samples instead —
          they demonstrate exactly the same thing.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-[20px] font-bold tracking-tight text-ink-900">Where the numbers come from</h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-700">
          Rejection rates vary a lot depending on which measure you use, so here is every figure this
          site quotes, with its source and the counter-argument.
        </p>

        <dl className="mt-5 space-y-3">
          {SOURCES.map(([claim, source]) => (
            <div key={claim} className="rounded-md border border-ink-100 bg-white px-4 py-3.5">
              <dt className="text-[14.5px] font-semibold text-ink-900">{claim}</dt>
              <dd className="mt-1 text-[13.5px] leading-relaxed text-ink-700">{source}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 rounded-md border-l-4 border-wait bg-wait-soft px-4 py-3.5">
          <p className="text-[12.5px] font-bold uppercase tracking-[0.08em] text-wait">
            EPFO&rsquo;s side of it
          </p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink-800">
            EPFO points to 5.08 crore claims settled in FY 2024-25, an auto-settlement route that
            now covers claims up to Rs 5 lakh and clears fully KYC-linked cases in about three
            working days, and return rates it says are falling. That is the baseline this product
            measures against — the case for building this is the gap between that clean path and
            what happens when one field disagrees, not a claim that EPFO is standing still.
          </p>
        </div>

        <div className="mt-4 rounded-md border border-ink-100 bg-white px-4 py-3.5">
          <p className="text-[12.5px] font-bold uppercase tracking-[0.08em] text-ink-500">
            How we observed the portal
          </p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink-700">
            Everything said here about EPFO&rsquo;s screens and links was seen by browsing the public
            portal by hand, in an ordinary browser session, at pages any member reaches on sign-in.
            No automated access, no load testing, and nothing that interacted with a live claim.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-500">
          A limitation worth naming
        </h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-700">
          Optical character recognition on Indic scripts is not reliable enough to trust silently. In
          our own testing, a vision model read a Kannada passbook name as a different surname
          entirely while reading the account number perfectly. That is why the document step asks you
          to confirm what was read before anything is compared — a wrong extraction would produce a
          confident wrong answer, and the comparison logic cannot tell the difference.
        </p>
      </section>
    </main>
  );
}
