import type { CaseView } from './case';
import type { RungId, Filing } from './escalation';
import { rungById } from './escalation';

/**
 * The words, generated from the case.
 *
 * These are templates filled deterministically from facts the case already
 * holds - not model output. That is a deliberate choice and it is the same one
 * the gate engine makes: the structure, the statutory references and the date
 * arithmetic have to be right every single time, and a fluent paragraph that
 * cites the wrong section of the RTI Act is worse than no draft at all.
 *
 * What a member gets is text they can read, edit, copy and file themselves on
 * the real portal. Nothing here is transmitted anywhere.
 */

export interface Draft {
  subject: string;
  body: string;
  /** what makes this draft worth filing rather than a template reply */
  note: string;
}

const d = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

const plus = (iso: string | null | undefined, days: number) => {
  if (!iso) return '—';
  const t = new Date(iso);
  t.setDate(t.getDate() + days);
  return t.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** The blockers, named the way a grievance has to name them to be actionable. */
function failures(c: CaseView): string[] {
  return c.resolution.gates
    .filter((g) => g.status === 'red' || g.status === 'blocked')
    .map((g) => `${g.title} — ${g.problem}${g.actor ? ` (to be actioned by: ${g.actor})` : ''}`);
}

export function draftFor(rung: RungId, c: CaseView, filings: Filing[]): Draft {
  const m = c.member;
  const ref = c.claimReference ?? '(claim reference)';
  const filedOn = d(c.claimSubmittedAt);
  const blockers = failures(c);
  const prior = filings.find((f) => f.disposed);
  const priorRef = prior?.reference ?? '(grievance registration number)';

  const who = `Name: ${m.display_name}\nUAN: ${m.uan}\nEstablishment: ${m.employer_name ?? '—'}\nClaim reference: ${ref}\nClaim filed on: ${filedOn}`;

  switch (rung) {
    case 'epfigms':
      return {
        subject: `Claim ${ref} not settled within the prescribed period — UAN ${m.uan}`,
        note: 'Specific dates and a specific request are what separate a grievance that gets worked from one that gets a template reply.',
        body: `${who}

Respected Sir/Madam,

I filed the above claim on ${filedOn}. As on today it has neither been settled nor returned to me with a reason. The prescribed settlement period of 20 days from ${filedOn} expired on ${plus(c.claimSubmittedAt, 20)}.

${
  blockers.length
    ? `The following items appear to be outstanding on my record:\n${blockers.map((b, i) => `  ${i + 1}. ${b}`).join('\n')}\n`
    : 'No deficiency has been communicated to me at any point.\n'
}
I request the following, specifically:

  1. The present status of claim ${ref}, and the date it was last acted upon.
  2. If the claim has been rejected or returned, the exact reason recorded, in writing.
  3. If any document or correction is required from me, the precise field and the precise record it must match.
  4. The date by which the claim will be settled.

A general reply that the claim is "under process" does not answer any of the above. Please treat this as a request for the specific particulars listed.

Yours faithfully,
${m.display_name}
UAN ${m.uan}`,
      };

    case 'cpgrams':
    case 'cpgrams_appeal': {
      const isAppeal = rung === 'cpgrams_appeal';
      return {
        subject: isAppeal
          ? `Appeal against disposal of grievance ${priorRef} — UAN ${m.uan}`
          : `Escalation: unsettled EPF claim ${ref} — UAN ${m.uan}`,
        note: 'Three paragraphs: what you asked, what they replied, and why the reply does not address the request. An appeal that only repeats the original grievance is usually disposed the same way.',
        body: `${who}
Grievance registration number: ${priorRef}
Date of disposal: ${prior ? `day ${prior.dayCount} after filing` : '—'}

Respected Sir/Madam,

WHAT I ASKED. On the grievance registered as ${priorRef}, I asked for four specific particulars regarding claim ${ref}: its present status and the date last acted upon, the exact reason recorded if it was rejected or returned, the precise field requiring correction if any, and the date by which it would be settled.

WHAT I RECEIVED. The grievance was marked disposed with a reply stating in substance that the matter had been forwarded to the field office and that the claim was under process, and advising me to check the portal later.

WHY THIS DOES NOT ADDRESS THE REQUEST. The reply does not state the status, does not give a date on which the claim was last acted upon, does not record any reason for the delay, does not identify any deficiency on my part, and does not commit to a date. Marking the grievance disposed has closed the ticket without resolving the matter it was raised about. The claim remains unsettled as on today.

I therefore request that the disposal be set aside and the four particulars above be furnished.

Yours faithfully,
${m.display_name}
UAN ${m.uan}`,
      };
    }

    case 'rti':
      return {
        subject: `Request under the Right to Information Act, 2005 — claim ${ref}, UAN ${m.uan}`,
        note: 'An RTI is only as good as its question. "Please provide the status of my claim" gets a lawful non-answer. Asking for file notings, movement dates and the designation of the deciding officer does not.',
        body: `To,
The Central Public Information Officer,
Employees' Provident Fund Organisation,
(regional office holding UAN ${m.uan})

Application under section 6(1) of the Right to Information Act, 2005

${who}
Grievance registration number, if any: ${priorRef}

I request the following information in respect of claim ${ref} filed under UAN ${m.uan}:

  1. Certified copies of the file notings recorded on the said claim, from the date of receipt to the date of this application.
  2. The dates on which the said claim moved between sections or officers, with the name of each section.
  3. The designation of the officer who recorded any rejection, return or deficiency remark on the said claim, and the exact text of that remark.
  4. Copies of any communication issued to me in respect of the said claim, with dispatch dates.
  5. The action taken on grievance ${priorRef}, including the file notings recorded on it before it was disposed.
  6. The prescribed timeline within which a claim of this category is required to be settled, and the reason recorded, if any, for the time taken in this case.

I am not seeking any opinion, advice, or interpretation. Each item above is a record held by the public authority within the meaning of section 2(f).

The prescribed fee is enclosed / I belong to the Below Poverty Line category and enclose proof (delete as applicable).

Please note that under section 7(1) the information is to be furnished within 30 days of receipt of this application.

Yours faithfully,
${m.display_name}
UAN ${m.uan}
Date: ${d(new Date().toISOString())}`,
      };

    case 'rpfc':
      return {
        subject: `Unsettled claim ${ref} — escalation after grievance, appeal and RTI — UAN ${m.uan}`,
        note: 'This one works because everything before it is on the record. Cite the reference numbers; they are the reason this letter is different from the first one.',
        body: `To,
The Regional Provident Fund Commissioner,
(regional office holding UAN ${m.uan})

${who}

Respected Sir/Madam,

I am writing after exhausting the channels available to me.

${filings
  .map(
    (f, i) =>
      `  ${i + 1}. ${rungById(f.rung).channel} — reference ${f.reference}${f.disposed ? `, disposed after ${f.dayCount} days without resolving the matter` : ', no reply received'}.`,
  )
  .join('\n')}

The claim was filed on ${filedOn} and remains unsettled. No deficiency has been communicated to me that I have failed to remedy.

I request your personal intervention to have the claim settled, and to have communicated to me in writing the reason it was not settled within the prescribed period.

Yours faithfully,
${m.display_name}
UAN ${m.uan}`,
      };

    case 'wait':
    default:
      return {
        subject: '',
        note: 'Nothing to file yet. The claim is inside its prescribed period.',
        body: '',
      };
  }
}

/** The employer track runs beside the ladder rather than on it. */
export function employerEmail(c: CaseView): Draft {
  const m = c.member;
  const theirs = c.resolution.gates.filter(
    (g) => g.actor === 'employer' && (g.status === 'red' || g.status === 'blocked'),
  );
  return {
    subject: `PF record correction request — ${m.display_name}, UAN ${m.uan}`,
    note: 'Short, specific, and it names the screen. HR desks action what they can find.',
    body: `Dear Sir/Madam,

I worked at ${m.employer_name ?? 'your establishment'} and my PF is held under UAN ${m.uan}.

${
  theirs.length
    ? `The following can only be actioned by the employer on the Employer Portal:\n\n${theirs
        .map((g, i) => `  ${i + 1}. ${g.title} — ${g.route?.label ?? g.problem}`)
        .join('\n')}\n`
    : 'I would be grateful if you could confirm my service dates as recorded on the Employer Portal.\n'
}
Each of these takes a few minutes on a portal you already have access to, and until it is done my claim cannot proceed.

I would be grateful for your help.

${m.display_name}
UAN ${m.uan}`,
  };
}
