import type { GateId } from './gates/types';

/**
 * One entry per gate: what EPFO makes you do today, why it fails, and what we
 * do instead. This is the content behind every /fix page and the comparison on
 * the home page - written once, rendered in both places.
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
  /** shown as a callout - the thing nobody tells you */
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
      'Install two separate apps: UMANG, and Aadhaar Face RD. The second one has no interface - it exists only so the first can scan your face.',
      'In UMANG, open EPFO Services and choose UAN Activation via Face Authentication.',
      'Enter your UAN and the mobile number linked to your Aadhaar. If you are not sure which number that is, check it before you start - a wrong guess costs you the attempt.',
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
      'You pick a document, type the details in by hand, and save. Nothing is compared against anything. The request then waits with your company - not with EPFO - for 7 to 10 days, if they act at all. EPFO treats your Aadhaar as the correct version, so one letter out of place is enough to be turned down. And you only find out one mistake at a time: fix one, wait, get refused for the next.',
    fix: 'We check all four together, before you send anything. Your name, date of birth and parent name are compared across Aadhaar, PAN, your bank and EPFO at the same time, so you see every problem at once instead of one refusal at a time. The check is plain rules, not an AI guess - a wrong guess here would cost somebody their rent.',
    steps: [
      'Upload or photograph all four: Aadhaar, PAN, bank passbook or cheque, and your EPFO profile.',
      'We read each one, including passbooks printed in Kannada, Hindi and other Indic scripts.',
      'Confirm what we read. OCR is not perfect and you get the final say before anything is compared.',
      'We line the four up field by field and show you exactly where they differ, character by character, the same way EPFO compares them.',
      'For each difference we tell you which record is the odd one out, who can change it - you, your company, or the bank - and how long that takes.',
    ],
    warning:
      'Which route applies to you matters enormously, and it changed recently. If your UAN is Aadhaar-verified you can now file the Joint Declaration yourself through DigiLocker for name and date-of-birth corrections, with no employer approval at all - which is what finally unblocks people whose old company has shut down. If you are not Aadhaar-verified, it falls back to your employer raising it on the Employer Portal, or to the paper declaration. We ask which situation you are in rather than assuming the slowest one.',
  },

  e_nomination: {
    id: 'e_nomination',
    name: 'Filing your e-Nomination',
    epfoPath: 'Manage → e-Nomination',
    epfoHost: 'unifiedportal-mem.epfindia.gov.in',
    breaks:
      'The job itself is easy - name a family member, confirm with a code sent to your phone, done. The problem is that nobody tells you it is required. Until it is done, the page where you ask for your money will not open at all. People find this out at the very moment they try to claim, after already waiting weeks for everything else.',
    fix: 'We move it out of a buried menu and put it in the main list, with the reason said plainly: until this is done, your claim page will not open. It takes about a day. It should never be the thing that catches you out.',
    steps: [
      'Have your nominee\'s Aadhaar number and date of birth ready.',
      'Add each nominee and the share of the amount they should receive. Shares must total 100%.',
      'Verify with an Aadhaar OTP.',
      'That is the whole task. It is genuinely quick - the cost is only ever in not knowing it was required.',
    ],
  },

  exit_marked: {
    id: 'exit_marked',
    name: 'Marking your date of exit',
    epfoPath: 'Manage → Mark Exit',
    epfoHost: 'unifiedportal-mem.epfindia.gov.in',
    breaks:
      'If nobody records the day you left, EPFO counts you as still working there, and the forms for taking your money out cannot be sent at all. Normally your old company enters it, and they are in no hurry. You are only allowed to enter it yourself two months after leaving.',
    fix: 'We spot it from your job history instead of waiting for you to find the right menu, and we write the message to send your old company for you - naming the exact box and the exact screen, so whoever reads it does not have to guess what you are asking for.',
    steps: [
      'We read your service history and find the employment with no end date.',
      'If it has been under two months, we draft a message for your previous employer with the specific action they need to take.',
      'If it has been over two months, you can set it yourself with an Aadhaar OTP, and we walk you through it.',
      'Either way you end up with the date that lets your claim go through.',
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
      'Missing dates and breaks make EPFO count fewer working years than you actually did - which is how someone who worked eleven years gets told they have not reached ten. And when someone gets stuck, a company will often just open them a second PF account, which cuts the record in half. Joining the two back together needs your name and details to match on both, which is usually the thing that was broken to begin with.',
    fix: 'We lay your whole working life out as one line, mark the breaks, spot a second account if you have one, and put the steps in the order that actually works - get your details matching first, then join the accounts - instead of letting you try it the way that fails.',
    steps: [
      'We lay out every employment period we can see, across every UAN.',
      'Genuine breaks in contribution are marked. Normal three-week gaps between jobs are not - those are not service breaks and flagging them would be noise.',
      'If a second PF account exists, we say so plainly and explain why it cuts your pension years in half.',
      'We join the accounts only after your details match, because EPFO will not merge two records it cannot confirm belong to the same person.',
    ],
    warning:
      'Never let anyone open you a new PF account to get around a problem. It is the most damaging thing that can happen to your record, and it is almost always done kindly, by an HR team trying to help you.',
  },

  form_selected: {
    id: 'form_selected',
    name: 'Choosing the right form',
    epfoPath: 'Online Services → Claim (Form-31, 19, 10C & 10D)',
    epfoHost: 'unifiedportal-mem.epfindia.gov.in',
    breaks:
      'Sending the wrong form is one of the most common reasons claims come back, and the portal offers you four of them with no explanation of which is which. Asking for a partial advance when you have actually left, or asking for your pension as one payment after ten years of service, both fail as a matter of course. You find out 10 to 20 days later.',
    fix: 'Three plain questions - are you still working there, how long were you there, and what is the money for - and we tell you which form to send. We also show the ones we ruled out and why, so it feels like advice rather than a test.',
    steps: [
      'Are you still employed at that company?',
      'How long were you there?',
      'What do you need the money for?',
      'We name one form, explain in a sentence why it is that one, and show the three we ruled out with the reason for each.',
    ],
    warning:
      'Ten years of service is the line. Below it you can take your pension money as one payment. Above it you cannot, and instead you get a monthly amount once you turn 58. Most people have no idea which side of that line they are on until the claim comes back refused.',
  },

  attachments: {
    id: 'attachments',
    name: 'Attaching Form 15G',
    epfoPath: 'Online Services → Claim → upload',
    epfoHost: 'unifiedportal-mem.epfindia.gov.in',
    breaks:
      'If you worked there under five years and you are taking out more than ₹50,000, tax is cut from the money before it reaches you - unless you attach Form 15G. Nobody mentions this until you are already filling in the claim, and the rules about the file itself, a PDF under 2 MB, are easy to miss.',
    fix: 'We work out whether it applies to you from how long you worked and how much you are claiming, and tell you before you start rather than at the last step. If it does not apply, you never see it at all.',
    steps: [
      'We check your continuous service and the amount being claimed.',
      'If Form 15G applies, we say why, and what you are actually declaring by signing it - that your income for the year is below the level where tax is due.',
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
      'One word telling you where your claim stands, on a different website with a different login. No date, no reason, no next step, and no hint that anything is wrong.',
    fix: 'A count of working days that goes down as you finish each step, with what is holding it up and what you can do today. Your case sits at a link you can save, share, or come back to next week.',
  },
  {
    slug: 'grievance',
    name: 'Raising a grievance and escalating',
    epfoPath: 'Register Grievance → Send Reminder → RPFC → RTI',
    epfoHost: 'epfigms.gov.in',
    breaks:
      'You type a complaint into an empty box with no idea which details matter. It goes to one of 135 offices around the country and usually takes 15 to 30 working days. There are further steps you can take if nothing happens, but nobody writes them down.',
    fix: 'We write the complaint for you, naming exactly which step failed and on what date, and lay out what to do if it is ignored, with the date for each: a reminder inside the same complaint, then the Regional PF Commissioner, then a Right to Information request - which the law says must be answered in writing within 30 days.',
  },
] as const;

/**
 * The same "what breaks / what we do" content as tight, scannable points.
 * A judge should be able to read a gate in five seconds, not a paragraph - so
 * the pages render these bullets, keyed by gate id (and by slug for the two
 * extra processes).
 */
export const POINTS: Record<string, { breaks: string[]; fix: string[] }> = {
  uan_active: {
    breaks: [
      'Removed from the website entirely - older guides now dead-end.',
      'The OTP goes to your Aadhaar-linked mobile, not the number HR has on file.',
      'Repeated face-scan failures usually mean your Aadhaar photo is too old.',
    ],
    fix: [
      'We name both apps you need before you start.',
      'We tell you which phone number the OTP will actually reach.',
      'We warn you the passbook stays empty 6–24 hours - so you don’t retry.',
    ],
  },
  records_agree: {
    breaks: [
      'You type each document in by hand; nothing is compared.',
      'One character different from Aadhaar is a rejection.',
      'The request sits with your employer, not EPFO - 7–10 days if they act.',
      'You discover mismatches one rejection at a time, weeks apart.',
    ],
    fix: [
      'All four records compared in one pass, before you file anything.',
      'Name, date of birth and parent name checked together, not serially.',
      'Rule-based matching - never a language model that could hallucinate a match.',
      'We name which records must change, and who has to change them.',
    ],
  },
  e_nomination: {
    breaks: [
      'The task is easy - but it is a hidden prerequisite.',
      'Without it, the Online Services claim page will not open at all.',
      'Nothing warns you until you are already trying to claim.',
    ],
    fix: [
      'Promoted from a buried menu item to a gate on the spine.',
      'The consequence is stated up front: this blocks your claim page.',
      'It costs a day - it should never be the thing that surprises you.',
    ],
  },
  exit_marked: {
    breaks: [
      'No exit date means EPFO still thinks you work there.',
      'Form 19 and Form 10C cannot be filed without it.',
      'Only your ex-employer can set it - you can only do it after two months.',
    ],
    fix: [
      'Detected from your service history, not left for you to find.',
      'We draft the message to your ex-employer, naming the exact field.',
      'Past two months, we walk you through doing it yourself.',
    ],
  },
  service_history: {
    breaks: [
      'Gaps and duplicate UANs make your pension service read short.',
      'A second UAN splits your record in two.',
      'Merging needs your identity to match first - the circular trap.',
    ],
    fix: [
      'Your whole history on one timeline, gaps and overlaps marked.',
      'Multiple UANs detected and explained plainly.',
      'We sequence it correctly: fix identity first, then merge.',
    ],
  },
  form_selected: {
    breaks: [
      'Four forms in one dropdown, no guidance on which is yours.',
      'The wrong form is a leading cause of rejection.',
      'You find out ten to twenty days later.',
    ],
    fix: [
      'Three plain questions name the form for you.',
      'We show the forms we ruled out, and why.',
      'It reads as advice, not a quiz.',
    ],
  },
  attachments: {
    breaks: [
      'Only needed under five years of service on amounts over ₹50,000.',
      'The requirement is not surfaced until you are already filing.',
      'PDF only, under 2 MB - easy to get wrong.',
    ],
    fix: [
      'We work out whether you need it from your service and balance.',
      'You are told before you start, not at the upload step.',
      'If you do not need it, the gate never appears.',
    ],
  },
  track: {
    breaks: [
      'A status word on a separate site, behind a separate login.',
      'No forecast, no cause, no next step.',
    ],
    fix: [
      'A number of working days that shrinks as gates clear.',
      'What is blocking it, and what you can do today.',
      'A link you can bookmark, share, or return to next week.',
    ],
  },
  grievance: {
    breaks: [
      'A free-text box with no clue which detail matters.',
      'Routes to one of 135 offices; typically 15–30 working days.',
      'The escalation ladder above it is real but undocumented.',
    ],
    fix: [
      'A grievance pre-drafted citing the exact gate that failed, with dates.',
      'The escalation ladder laid out - Reminder → RPFC → RTI - each pre-dated.',
      'An RTI legally compels a written response within 30 days.',
    ],
  },
};
