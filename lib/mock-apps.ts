import type { GateId } from './gates/types';

/**
 * The apps a member is sent out to, rebuilt here so a step can be DONE rather
 * than described.
 *
 * Up to now every one of these screens was a still life: a faithful picture of
 * the portal with a note underneath saying what would happen if you pressed the
 * button. That is honest, but it stops exactly where the interesting part
 * starts. These definitions carry the same fields plus the thing that was
 * missing - what filling them in and pressing submit actually does.
 *
 * Nothing here talks to a real system. Every one of them is labelled as a
 * rebuild on screen, and /whats-mocked lists them.
 */
export interface MockApp {
  /** the app as the member knows it */
  name: string;
  /** one line under the name, so nobody mistakes this for the real thing */
  tagline: string;
  /** brand colours, close enough to be recognisable */
  bar: string;
  accent: string;
  /** what pressing the final button is called there */
  submit: string;
  /** what it says while the fake request is in flight */
  working: string;
  /** what it says when it lands */
  done: string;
}

export const MOCK_APPS = {
  umang: {
    name: 'UMANG',
    tagline: 'Unified Mobile Application for New-age Governance',
    bar: 'bg-[#1a3a6b]',
    accent: 'text-[#1a3a6b]',
    submit: 'Verify with face authentication',
    working: 'Matching your face against Aadhaar',
    done: 'UAN activated. A password has been sent by SMS.',
  },
  digilocker: {
    name: 'DigiLocker',
    tagline: 'Documents wallet, Government of India',
    bar: 'bg-[#b4441f]',
    accent: 'text-[#b4441f]',
    submit: 'Share these documents',
    working: 'Fetching your issued documents',
    done: 'Documents shared. The Joint Declaration has been raised.',
  },
  epfo: {
    name: 'EPFO Member Portal',
    tagline: 'unifiedportal-mem.epfindia.gov.in',
    bar: 'bg-teal-900',
    accent: 'text-teal-800',
    submit: 'Submit',
    working: 'Sending to EPFO',
    done: 'Submitted. EPFO has accepted the request.',
  },
} as const satisfies Record<string, MockApp>;

export type MockAppId = keyof typeof MOCK_APPS;

/** Which app each gate sends you to, and what that visit is called. */
export const GATE_APP: Record<GateId, { app: MockAppId; title: string }> = {
  uan_active: { app: 'umang', title: 'Activate your UAN' },
  records_agree: { app: 'digilocker', title: 'Raise a Joint Declaration' },
  e_nomination: { app: 'epfo', title: 'File your e-Nomination' },
  exit_marked: { app: 'epfo', title: 'Mark your date of exit' },
  service_history: { app: 'epfo', title: 'Merge your accounts' },
  form_selected: { app: 'epfo', title: 'Choose and open your claim form' },
  attachments: { app: 'epfo', title: 'Attach Form 15G' },
};

/**
 * What "fill in demo details" puts in each field.
 *
 * Keyed by the field label so it stays next to the screen definitions rather
 * than duplicating them. Anything not listed falls back to the member's own
 * record where the screen prefills from it, and to empty otherwise - so this
 * only has to cover the fields a person would genuinely have to type.
 */
export const DEMO_VALUES: Record<string, string> = {
  'Aadhaar number': '0000 0000 0000',
  'Aadhaar OTP': '000000',
  'Aadhaar OTP to e-sign': '000000',
  'Enter OTP': '000000',
  'Get OTP': '000000',
  'Mobile number linked to Aadhaar': '+91 90000 00000',
  'Last 4 digits of your bank account': '0000',
  'Face scan': 'yes',
  'I declare the above is correct': 'yes',
  'I declare the above is true': 'yes',
  'Document type': 'Bank',
  'Document number': '0000 0000 0000',
  'IFSC (bank only)': 'DEMO0000001',
  'Address': 'Synthetic address, for the demo only',
  'Employee address': 'Synthetic address, for the demo only',
  'Nominee name': 'Demo Nominee',
  'Nominee Aadhaar number': '0000 0000 0000',
  'Relationship': 'Spouse',
  'Share (%)': '100',
  'Do you have a family?': 'Yes',
  'Reason of exit': 'Cessation (short service)',
  'Attestation through': 'Previous employer',
  'Amount required (₹)': '185000',
  'Purpose for which advance is required': 'Illness of member/family',
  'Form 15G / 15H': 'form-15g-demo.pdf',
  'Member ID / UAN to transfer from': 'Select previous account',
};
