import type { GateSpec, Provenance } from './types';
import { yes, no, all, always } from './predicate';

/**
 * Seven gates, in dependency order, replacing five hosts and a mobile app.
 *
 * Every latency carries provenance. EPFO policy moves — the auto-settlement
 * ceiling and the DigiLocker Joint Declaration route both changed recently — so
 * an unattributed number is a liability. Carrying the source and the date it was
 * checked means a stale figure is visible rather than quietly wrong, and adding
 * a new route when policy changes is a config edit, not a release.
 */
const CHECKED = '2026-08-24';

const p = (source: string, confidence: Provenance['confidence']): Provenance => ({
  source,
  sourcedAt: CHECKED,
  confidence,
});

export const SPEC: GateSpec = {
  version: '2026.08.2',

  // EPFO's auto-settlement path settles fully KYC-linked claims in about three
  // working days, and the ceiling was raised to Rs 5 lakh. This is the number a
  // clean claim should be measured against, not the old 10-20 day cycle.
  baselineSettlementDays: 3,
  baselineProvenance: p(
    'EPFO auto-settlement of claims for fully KYC-linked members; ceiling raised to Rs 5,00,000',
    'published',
  ),

  gates: [
    {
      id: 'uan_active',
      title: 'UAN activated',
      blocks: 'Passbook, UAN card, transfers and every online claim stay locked.',
      clears: all(yes('uanActive'), yes('aadhaarLinked')),
      appliesWhen: always,
      dependsOn: [],
      routes: [
        {
          when: always,
          route: {
            kind: 'walkthrough',
            href: '/fix/uan_active',
            actor: 'you',
            latencyDays: 2,
            label: 'Activate via UMANG face authentication',
            provenance: p(
              'Face authentication is minutes; the 6-24 hour backend sync afterwards is widely reported by members',
              'reported',
            ),
          },
        },
      ],
    },

    {
      id: 'records_agree',
      title: 'Your four records agree',
      blocks: 'Any claim you file is rejected on a data mismatch.',
      clears: { op: 'lte', fact: 'blockingMismatches', value: 0 },
      appliesWhen: always,
      dependsOn: ['uan_active'],
      routes: [
        {
          // The route that did not exist when this problem was described: an
          // Aadhaar-verified member can now file the Joint Declaration through
          // DigiLocker for name and date-of-birth corrections, with no employer
          // approval step at all. It is why the closed-employer trap is far less
          // severe than it used to be.
          when: yes('aadhaarLinked'),
          route: {
            kind: 'joint_declaration',
            href: '/fix/records_agree?route=digilocker',
            actor: 'you',
            latencyDays: 5,
            label: 'File the Joint Declaration yourself through DigiLocker',
            provenance: p(
              'EPFO Joint Declaration via DigiLocker for Aadhaar-verified members, removing employer approval for name and date-of-birth corrections. EPFO does not publish a turnaround, so the figure is our estimate',
              'estimate',
            ),
          },
        },
        {
          when: all(yes('employerResponsive'), no('errorFromClosedEmployer')),
          route: {
            kind: 'employer_message',
            href: '/fix/records_agree?route=employer',
            actor: 'employer',
            latencyDays: 10,
            label: 'Employer raises the correction on the Employer Portal',
            provenance: p(
              'EPFO states KYC approval reflects in 7-10 days once the employer acts; members widely report longer',
              'reported',
            ),
          },
        },
        {
          when: always,
          route: {
            kind: 'joint_declaration',
            href: '/fix/records_agree?route=joint-declaration',
            actor: 'epfo',
            latencyDays: 21,
            label: 'Paper Joint Declaration with Aadhaar, PAN and birth certificate',
            provenance: p(
              'The offline route where the member is not Aadhaar-verified. No published turnaround; estimated from member-reported field-office timelines',
              'estimate',
            ),
          },
        },
      ],
    },

    {
      id: 'e_nomination',
      title: 'e-Nomination filed',
      blocks: 'The Online Services claim page will not open at all.',
      clears: yes('eNominationFiled'),
      appliesWhen: always,
      dependsOn: ['uan_active'],
      routes: [
        {
          when: always,
          route: {
            kind: 'walkthrough',
            href: '/fix/e_nomination',
            actor: 'you',
            latencyDays: 1,
            label: 'File e-Nomination with Aadhaar OTP',
            provenance: p(
              'Recorded immediately on submission; nomination is mandatory under the EPF Scheme',
              'published',
            ),
          },
        },
      ],
    },

    {
      id: 'exit_marked',
      title: 'Date of exit marked',
      blocks: 'Form 19 and Form 10C cannot be filed without it.',
      clears: yes('exitMarked'),
      appliesWhen: no('stillEmployed'),
      dependsOn: ['uan_active'],
      routes: [
        {
          when: yes('employerResponsive'),
          route: {
            kind: 'employer_message',
            href: '/fix/exit_marked?route=employer',
            actor: 'employer',
            latencyDays: 7,
            label: 'Ask your previous employer to mark the exit date',
            provenance: p(
              'Depends entirely on employer responsiveness; no service standard applies to them',
              'estimate',
            ),
          },
        },
        {
          when: always,
          route: {
            kind: 'walkthrough',
            href: '/fix/exit_marked?route=self',
            actor: 'you',
            latencyDays: 9,
            label: 'Mark exit yourself after two months, with Aadhaar OTP',
            provenance: p(
              'Members may set their own date of exit two months after leaving; the wait, not the task, is the cost',
              'published',
            ),
          },
        },
      ],
    },

    {
      id: 'service_history',
      title: 'Service history clean',
      blocks: 'Pension service reads short, and a second UAN splits your record.',
      clears: all(
        { op: 'lte', fact: 'distinctUanCount', value: 1 },
        { op: 'lte', fact: 'serviceGapMonths', value: 0 },
      ),
      appliesWhen: always,
      dependsOn: ['records_agree', 'exit_marked'],
      routes: [
        {
          when: { op: 'gt', fact: 'distinctUanCount', value: 1 },
          route: {
            kind: 'merge_uan',
            href: '/fix/service_history?route=merge',
            actor: 'epfo',
            latencyDays: 13,
            label: 'Merge the second UAN via One Member-One EPF Account',
            provenance: p(
              'Form 13 transfer requires employer attestation and then EPFO processing; estimated from reported member timelines',
              'estimate',
            ),
          },
        },
        {
          when: always,
          route: {
            kind: 'employer_message',
            href: '/fix/service_history?route=gap',
            actor: 'employer',
            latencyDays: 9,
            label: 'Ask the employer to close the gap in service dates',
            provenance: p('Depends on employer action; no published standard', 'estimate'),
          },
        },
      ],
    },

    {
      id: 'form_selected',
      title: 'Correct form chosen',
      blocks: 'Filing the wrong form is a leading cause of rejection.',
      clears: yes('formSelected'),
      appliesWhen: always,
      dependsOn: ['e_nomination', 'exit_marked'],
      routes: [
        {
          when: always,
          route: {
            kind: 'form_picker',
            href: '/form',
            actor: 'you',
            latencyDays: 0,
            label: 'Answer three questions and we name the form',
            provenance: p('Three questions; costs no calendar time', 'published'),
          },
        },
      ],
    },

    {
      id: 'attachments',
      title: 'Form 15G attached',
      blocks: 'TDS is deducted, and the claim can be returned for the missing PDF.',
      clears: yes('form15gAttached'),
      appliesWhen: all(
        { op: 'lt', fact: 'continuousServiceMonths', value: 60 },
        { op: 'gt', fact: 'balanceRupees', value: 50_000 },
      ),
      dependsOn: ['form_selected'],
      routes: [
        {
          when: always,
          route: {
            kind: 'upload',
            href: '/fix/attachments',
            actor: 'you',
            latencyDays: 1,
            label: 'Attach Form 15G as a PDF under 2 MB',
            provenance: p(
              'TDS applies below five years of continuous service on amounts above Rs 50,000 unless Form 15G is filed',
              'published',
            ),
          },
        },
      ],
    },
  ],
};
