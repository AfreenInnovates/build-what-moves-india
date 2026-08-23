import type { GateId } from './gates/types';

/**
 * One entry per gate: what EPFO makes you do today, why it fails, and what we
 * do instead. This is the content behind every /fix page and the comparison on
 * the home page — written once, rendered in both places.
 */
export interface ProcessDoc {
  id: GateId;
  /** what a person would call this */
  name: string;
  /** where it lives on the real portal, or which app */
  epfoPath: string;
  epfoHost: string;
  /** the failure mode, in one paragraph */
  breaks: string;
  /** what we do differently */
  fix: string;
  /** the steps we actually walk them through */
  steps: string[];
  /** shown as a callout — the thing nobody tells you */
  warning?: string;
  /** true when we cannot rebuild it and can only explain it */
  explainOnly?: boolean;
}

export const PROCESSES: Record<GateId, ProcessDoc> = {
  uan_active: {
    id: 'uan_active',
    name: 'Activating your UAN',
    epfoPath: 'UMANG app → EPFO Services → UAN Activation via Face Authentication',
    epfoHost: 'UMANG app + Aadhaar Face RD app',
    breaks:
      'Activation was removed from the web portal entirely, so anyone following an older guide hits a dead end. The OTP goes to the mobile number linked to your Aadhaar, not the one your employer has on file, and most people do not know those are different numbers. Repeated face-scan failures usually mean the photograph in your Aadhaar record is too old.',
    fix: 'We cannot rebuild face authentication, and we do not pretend to. Instead we name both apps you need before you start, tell you which phone number the OTP will actually reach, and set the expectation that the passbook stays empty for 6 to 24 hours afterwards.',
    steps: [
      'Install two separate apps: UMANG, and Aadhaar Face RD. The second one has no interface — it exists only so the first can scan your face.',
      'In UMANG, open EPFO Services and choose UAN Activation via Face Authentication.',
      'Enter your UAN and the mobile number linked to your Aadhaar. If you are not sure which number that is, check it before you start — a wrong guess costs you the attempt.',
      'Complete the live face scan. It will ask you to blink and turn your head.',
      'Stop. Do not check the passbook yet.',
    ],
    warning:
      'After a successful activation the passbook and balance take 6 to 24 hours to appear while EPFO syncs its backends. This looks exactly like failure. It is not. Retrying during this window is the single most common wasted effort in the whole system.',
    explainOnly: true,
  },

  records_agree: {
    id: 'records_agree',
    name: 'Making your records agree',
    epfoPath: 'Manage → KYC',
    epfoHost: 'unifiedportal-mem.epfindia.gov.in',
    breaks:
      'You tick a document type, enter details, and save. The request then sits under "KYC Pending for Approval" and goes to your employer, not to EPFO — 7 to 10 days if they act at all. EPFO treats Aadhaar as the source of truth, so anything that differs from Aadhaar by even one character is a rejection. Worse, you discover mismatches one rejection at a time, each costing 10 to 20 days.',
    fix: 'We compare all four records in one pass, before you file anything. Name, date of birth and parent name are checked across Aadhaar, PAN, bank and EPFO simultaneously, so you see every problem at once instead of serially. The comparison is rule-based, not a language model — a hallucinated match would cost someone their rent.',
    steps: [
      'Upload or photograph all four: Aadhaar, PAN, bank passbook or cheque, and your EPFO profile.',
      'We read each one, including passbooks printed in Kannada, Hindi and other Indic scripts.',
      'Confirm what we read. OCR is not perfect and you get the final say before anything is compared.',
      'We normalise honorifics, initials and script differences, then score every pair and band the result.',
      'For each blocking difference you get the winning value, which records must change, and who has to change them.',
    ],
    warning:
      'Which route you take matters enormously. A responsive current employer can raise the correction on the Employer Portal in about 10 working days. If the employer is unreachable, or the error came from a company that no longer exists, it becomes a paper Joint Declaration with Aadhaar, PAN and birth certificate — roughly 21 days. We ask which situation you are in rather than assuming.',
  },

  e_nomination: {
    id: 'e_nomination',
    name: 'Filing your e-Nomination',
    epfoPath: 'Manage → e-Nomination',
    epfoHost: 'unifiedportal-mem.epfindia.gov.in',
    breaks:
      'The task itself is genuinely easy — add a nominee, Aadhaar OTP, done. The problem is that it is a hidden prerequisite. Without a valid e-nomination the Online Services claim page will not open at all, and nothing anywhere warns you. People discover it at the exact moment they try to claim, having already waited weeks for everything else.',
    fix: 'We promote it from a buried menu item to a gate on the spine, stated up front, with the consequence spelled out: this blocks your claim page entirely. It costs a day. It should never be the thing that surprises you.',
    steps: [
      'Have your nominee\'s Aadhaar number and date of birth ready.',
      'Add each nominee and the share of the amount they should receive. Shares must total 100%.',
      'Verify with an Aadhaar OTP.',
      'That is the whole task. It is genuinely quick — the cost is only ever in not knowing it was required.',
    ],
  },

  exit_marked: {
    id: 'exit_marked',
    name: 'Marking your date of exit',
    epfoPath: 'Manage → Mark Exit',
    epfoHost: 'unifiedportal-mem.epfindia.gov.in',
    breaks:
      'If your last working day is not recorded, EPFO considers you still employed there, and Form 19 and Form 10C cannot be filed at all. Normally your ex-employer sets it, and they have no incentive to hurry. You can only do it yourself two months after leaving.',
    fix: 'We detect it from your service history rather than waiting for you to find the menu, and we generate the message to send your ex-employer — naming the exact field and the exact screen they need, so the person receiving it does not have to work out what you want.',
    steps: [
      'We read your service history and find the employment with no end date.',
      'If it has been under two months, we draft a message for your previous employer with the specific action they need to take.',
      'If it has been over two months, you can set it yourself with an Aadhaar OTP, and we walk you through it.',
      'Either way you get the date that unblocks Form 19 and Form 10C.',
    ],
    warning:
      'Two months is the line. Before it, only your employer can act. After it, you can. Knowing which side you are on changes who you should be chasing today.',
  },

  service_history: {
    id: 'service_history',
    name: 'Cleaning up your service history',
    epfoPath: 'View → Service History, then Online Services → One Member–One EPF Account',
    epfoHost: 'unifiedportal-mem.epfindia.gov.in',
    breaks:
      'Gaps, overlaps and missing exit dates make EPFO read your pensionable service as shorter than it was — which is how someone with eleven years of work is told they have under ten. And people who hit a wall often have a second UAN created for them, which splits the record in half. Merging requires your identity to match across both UANs, which is usually the very thing that was broken in the first place.',
    fix: 'We show your whole employment history as one timeline with gaps and overlaps marked, detect multiple UANs, and sequence the merge correctly — identity first, then merge — instead of letting you attempt it in the order that fails.',
    steps: [
      'We lay out every employment period we can see, across every UAN.',
      'Genuine breaks in contribution are marked. Normal three-week gaps between jobs are not — those are not service breaks and flagging them would be noise.',
      'If a second UAN exists, we say so plainly and explain why it halves your pension service.',
      'We file the merge in the right order, after your records agree, because EPFO will not merge two identities it cannot confirm are the same person.',
    ],
    warning:
      'Never let anyone create a new UAN to get around a problem. It is the most damaging thing that can happen to your record, and it is usually done with good intentions by an HR team trying to unblock you.',
  },

  form_selected: {
    id: 'form_selected',
    name: 'Choosing the right form',
    epfoPath: 'Online Services → Claim (Form-31, 19, 10C & 10D)',
    epfoHost: 'unifiedportal-mem.epfindia.gov.in',
    breaks:
      'Filing the wrong form is the single biggest cause of rejection, and the portal gives you four options with no guidance. Form 31 with an "out of service" reason, or Form 10C when you have crossed ten years of service, are routine failures. You find out 10 to 20 days later.',
    fix: 'Three plain questions — are you still working there, how long were you there, and what is the money for — and we name the form. We also show the forms we ruled out and why, so it reads as advice rather than a quiz.',
    steps: [
      'Are you still employed at that company?',
      'How long were you there?',
      'What do you need the money for?',
      'We name one form, explain in a sentence why it is that one, and show the three we ruled out with the reason for each.',
    ],
    warning:
      'The ten-year mark decides whether your pension pot is a lump sum or a monthly pension you cannot touch until 58. Most people do not know which side of that line they are on until the claim comes back.',
  },

  attachments: {
    id: 'attachments',
    name: 'Attaching Form 15G',
    epfoPath: 'Online Services → Claim → upload',
    epfoHost: 'unifiedportal-mem.epfindia.gov.in',
    breaks:
      'If your continuous service is under five years and the amount is over ₹50,000, tax is deducted at source unless you attach Form 15G. The requirement is not surfaced until you are already filing, and the file constraints — PDF, under 2 MB — are easy to miss.',
    fix: 'We work out whether you need it from your service length and balance, and tell you before you start rather than at the upload step. If you do not need it, the gate never appears.',
    steps: [
      'We check your continuous service and the amount being claimed.',
      'If Form 15G applies, we say why, and what it actually declares — that your total income is below the taxable limit.',
      'Attach it as a PDF under 2 MB.',
    ],
  },
};

/** Processes that are not gates, but are still part of the journey. */
export const EXTRA_PROCESSES = [
  {
    slug: 'track',
    name: 'Tracking your claim',
    epfoPath: 'A different host entirely',
    epfoHost: 'passbook.epfindia.gov.in/MemberPassBook/',
    breaks:
      'A status word on a separate site with a separate login. No forecast, no cause, no next step, and no indication of whether anything is wrong.',
    fix: 'A number of working days that shrinks as gates clear, with what is blocking it and what you can do today. Your case lives at a link you can bookmark, share or come back to next week.',
  },
  {
    slug: 'grievance',
    name: 'Raising a grievance and escalating',
    epfoPath: 'Register Grievance → Send Reminder → RPFC → RTI',
    epfoHost: 'epfigms.gov.in',
    breaks:
      'You write a free-text complaint into a box with no idea what detail matters, it routes to one of 135 field offices, and typically takes 15 to 30 working days. The escalation ladder above it is real but undocumented.',
    fix: 'We pre-draft the grievance citing the specific gate that failed and the dates it failed on, and lay out the escalation ladder with each rung pre-dated: Send Reminder inside the same grievance, then the Regional PF Commissioner, then an RTI — which legally requires a written response within 30 days.',
  },
] as const;
