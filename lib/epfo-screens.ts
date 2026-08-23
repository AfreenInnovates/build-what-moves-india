import type { GateId } from './gates/types';

/**
 * The actual EPFO screens, field for field, as a member meets them today.
 *
 * These are reproduced so anyone who has used the portal recognises exactly
 * where they are — and so every place we substitute something is labelled
 * rather than glossed over. `note` on a field is the honest answer to "what
 * really happens here".
 */
export interface EpfoField {
  label: string;
  kind: 'text' | 'date' | 'select' | 'file' | 'otp' | 'readonly' | 'checkbox' | 'radio';
  placeholder?: string;
  options?: string[];
  /** what this is in the real system, and what it is here */
  note?: string;
  /** filled from the member record where EPFO would prefill it */
  prefill?: 'name' | 'uan' | 'dob' | 'employer' | 'exit' | 'father';
  required?: boolean;
}

export interface EpfoScreen {
  /** the literal name of the screen on the portal */
  screenTitle: string;
  breadcrumb: string;
  intro?: string;
  fields: EpfoField[];
  submit: string;
  /** what actually happens after you press it */
  afterSubmit: string;
  /** how long you then wait, and on whom */
  afterWait?: string;
}

export const EPFO_SCREENS: Record<GateId, EpfoScreen> = {
  uan_active: {
    screenTitle: 'UAN Activation via Face Authentication',
    breadcrumb: 'UMANG app → EPFO Services → UAN Activation',
    intro:
      'Since 2026 this screen does not exist on the website at all. It is inside the UMANG app, and it will not work unless the separate Aadhaar Face RD app is also installed.',
    fields: [
      { label: 'UAN', kind: 'text', prefill: 'uan', required: true },
      { label: 'Aadhaar number', kind: 'text', placeholder: 'XXXX XXXX 5528', required: true, note: 'Real: verified live against UIDAI. Here: no Aadhaar is checked and none is stored.' },
      { label: 'Mobile number linked to Aadhaar', kind: 'text', placeholder: '+91 XXXXX XXXXX', required: true, note: 'This is the number on your Aadhaar record, not the one your employer has. Getting this wrong is the most common failure on this screen.' },
      { label: 'Enter OTP', kind: 'otp', note: 'Real: a live SMS to the Aadhaar-linked number. Here: no SMS is sent and any six digits are accepted.' },
      { label: 'Face scan', kind: 'checkbox', note: 'Real: a liveness check with blink and head-turn prompts, run by the Face RD app against your Aadhaar photograph. Here: nothing is captured and no camera is opened.' },
    ],
    submit: 'Activate UAN',
    afterSubmit: 'Activation is recorded, and a password is sent by SMS.',
    afterWait:
      'The passbook and balance stay empty for another 6 to 24 hours while EPFO syncs its backends. This looks identical to failure, and it is why so many people retry.',
  },

  records_agree: {
    screenTitle: 'KYC',
    breadcrumb: 'Member portal → Manage → KYC',
    intro:
      'You tick one document at a time and type the details in by hand. There is no comparison against anything — the portal will happily accept a name that does not match your Aadhaar, and tell you twenty days later.',
    fields: [
      {
        label: 'Document type',
        kind: 'select',
        options: ['Bank', 'PAN', 'Aadhaar', 'Passport', 'Driving Licence', 'Election Card', 'Ration Card'],
        required: true,
      },
      { label: 'Document number', kind: 'text', placeholder: 'Account number / PAN / Aadhaar', required: true },
      { label: 'Name as per document', kind: 'text', prefill: 'name', required: true, note: 'Must match Aadhaar exactly, character for character. Nothing on this screen tells you that, and nothing checks it.' },
      { label: 'IFSC (bank only)', kind: 'text', placeholder: 'DEMO0000001' },
      { label: 'I declare the above is correct', kind: 'checkbox', required: true },
    ],
    submit: 'Save',
    afterSubmit: 'The entry moves to a list headed "KYC Pending for Approval".',
    afterWait:
      'It now sits with your employer, not with EPFO. Typically 7 to 10 days if they act. If the data is already wrong in EPFO\'s database, this route cannot fix it at all — that needs a paper Joint Declaration.',
  },

  e_nomination: {
    screenTitle: 'e-Nomination',
    breadcrumb: 'Member portal → Manage → e-Nomination',
    intro:
      'Genuinely one of the better screens on the portal. The problem is not this form — it is that nothing anywhere tells you the claim page will not open until you have filled it.',
    fields: [
      { label: 'Do you have a family?', kind: 'radio', options: ['Yes', 'No'], required: true, note: 'Answering No sends you down a different path entirely, for nominating someone outside your family.' },
      { label: 'Nominee Aadhaar number', kind: 'text', placeholder: 'XXXX XXXX XXXX', required: true, note: 'Real: verified against UIDAI, and the nominee name is pulled from there. Here: nothing is verified.' },
      { label: 'Nominee name', kind: 'text', required: true },
      { label: 'Date of birth', kind: 'date', required: true },
      { label: 'Relationship', kind: 'select', options: ['Spouse', 'Son', 'Daughter', 'Mother', 'Father'], required: true },
      { label: 'Address', kind: 'text', required: true },
      { label: 'Share of total amount (%)', kind: 'text', placeholder: '100', required: true, note: 'Shares across all nominees must total exactly 100, or the form is rejected on submit with no explanation of which line is wrong.' },
      { label: 'Guardian (if nominee is a minor)', kind: 'text' },
      { label: 'Aadhaar OTP to e-sign', kind: 'otp', note: 'Real: an OTP to your Aadhaar-linked mobile, which e-signs the declaration. Here: no OTP is sent.' },
    ],
    submit: 'Save family details and e-Sign',
    afterSubmit: 'The nomination is recorded immediately and the claim page unlocks.',
    afterWait: 'No waiting. This one is genuinely instant — which is exactly why discovering it late is so wasteful.',
  },

  exit_marked: {
    screenTitle: 'Mark Exit',
    breadcrumb: 'Member portal → Manage → Mark Exit',
    intro:
      'You can only reach this screen for a past employment, and only two months after you left. Before that, the option is simply not available to you.',
    fields: [
      { label: 'Select employment', kind: 'select', options: ['Select PF account number'], prefill: 'employer', required: true, note: 'Listed by PF account number, not by company name. Most people cannot tell which of their jobs is which.' },
      { label: 'Date of exit', kind: 'date', required: true, note: 'Must be your actual last working day. A wrong date here distorts your pensionable service.' },
      { label: 'Reason of exit', kind: 'select', options: ['Cessation (short service)', 'Retirement', 'Superannuation', 'Death in service'], required: true },
      { label: 'Aadhaar OTP', kind: 'otp', note: 'Real: OTP to your Aadhaar-linked mobile. Here: no OTP is sent.' },
    ],
    submit: 'Update',
    afterSubmit: 'The exit date is written to your service history and cannot be edited afterwards.',
    afterWait:
      'Instant if you are eligible to do it yourself. If it has been under two months, only your previous employer can — and there is no button here that tells them.',
  },

  service_history: {
    screenTitle: 'One Member – One EPF Account (Transfer Request)',
    breadcrumb: 'Member portal → Online Services → One Member – One EPF Account',
    intro:
      'This is Form 13. It moves a balance from an old member ID into your current one, and it is also the only correct way to deal with a duplicate UAN.',
    fields: [
      { label: 'Present employer details', kind: 'readonly', prefill: 'employer' },
      { label: 'Attestation through', kind: 'radio', options: ['Present employer', 'Previous employer'], required: true, note: 'Whichever you choose then has to approve it on a portal you cannot see. If you pick one that will not respond, the request simply sits there.' },
      { label: 'Member ID / UAN to transfer from', kind: 'select', options: ['Select previous account'], required: true, note: 'Requires your identity to match across both accounts. If the mismatch is what caused the second UAN, this step fails — which is the circularity at the heart of the problem.' },
      { label: 'Get OTP', kind: 'otp', note: 'Real: OTP to your UAN-registered mobile. Here: no OTP is sent.' },
    ],
    submit: 'Submit transfer request',
    afterSubmit: 'A tracking ID is generated and the request goes to the chosen employer for attestation.',
    afterWait:
      'Employer attestation, then EPFO processing. Roughly 13 working days when it goes smoothly, and indefinite when the employer does not act.',
  },

  form_selected: {
    screenTitle: 'Claim (Form-31, 19, 10C & 10D)',
    breadcrumb: 'Member portal → Online Services → Claim',
    intro:
      'Four forms in one dropdown, no guidance on which applies to you, and no validation that your choice matches your circumstances. Picking wrong is the single biggest cause of rejection.',
    fields: [
      { label: 'Last 4 digits of your bank account', kind: 'text', placeholder: '5678', required: true, note: 'Real: checked against your KYC-linked account before the form will open. Here: nothing is checked.' },
      {
        label: 'I want to apply for',
        kind: 'select',
        options: [
          'Only PF Withdrawal (Form-19)',
          'Only Pension Withdrawal (Form-10C)',
          'PF Advance (Form-31)',
          'Monthly Pension (Form-10D)',
        ],
        required: true,
        note: 'The portal will let you pick any of these regardless of eligibility. Form-10C when you have crossed ten years, or Form-31 with an out-of-service reason, are routine rejections.',
      },
      { label: 'Purpose for which advance is required', kind: 'select', options: ['Illness of member/family', 'Purchase of house', 'Marriage', 'Post matriculation education', 'Unemployment'] },
      { label: 'Amount required (₹)', kind: 'text', placeholder: '185000' },
      { label: 'Employee address', kind: 'text', required: true, note: 'Must match your Aadhaar address. A different address here is grounds for rejection on its own.' },
      { label: 'Upload cancelled cheque or passbook', kind: 'file', note: 'Real: image or PDF, clear enough to read the account number and IFSC. Here: nothing is uploaded.' },
    ],
    submit: 'Get Aadhaar OTP and submit claim',
    afterSubmit: 'The claim is filed and a reference number is issued.',
    afterWait:
      '10 to 20 working days to an outcome. If it is rejected, you fix the cause and refile, and the clock starts again from zero.',
  },

  attachments: {
    screenTitle: 'Form 15G upload',
    breadcrumb: 'Member portal → Online Services → Claim → Upload',
    intro:
      'Whether you need this at all depends on your continuous service and the amount — and the portal does not tell you until you are already mid-claim.',
    fields: [
      { label: 'Form 15G / 15H', kind: 'file', required: true, note: 'Real: PDF only, strictly under 2 MB. Larger files fail with a generic error. Here: nothing is uploaded.' },
      { label: 'Total estimated income for the year (₹)', kind: 'text', note: 'This is what Form 15G actually declares — that your income is below the taxable limit, so no TDS should be deducted.' },
      { label: 'I declare the above is true', kind: 'checkbox', required: true },
    ],
    submit: 'Attach and continue',
    afterSubmit: 'The declaration is attached to the claim.',
    afterWait:
      'No separate wait, but a missing or oversized file can bounce the whole claim back after the full processing period.',
  },
};
