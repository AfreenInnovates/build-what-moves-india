import type { GateSpec } from './types';
import { yes, no, all, always } from './predicate';

/**
 * Seven gates, in dependency order, replacing five hosts and a mobile app.
 *
 * Latencies are working days and are deliberately in ONE place: they are the
 * only thing separating "your claim is stuck" from "your claim settles on the
 * 27th". Tune them here, never in a component.
 */
export const SPEC: GateSpec = {
  version: '2026.08.1',
  baselineSettlementDays: 4, // a clean, Aadhaar-linked claim settles in 3-5 working days

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
            latencyDays: 2, // face auth is minutes; the backend sync is 6-24h, call it 2 days
            label: 'Activate via UMANG face authentication',
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
          // fastest path, but only if a current employer can actually raise it
          when: all(yes('employerResponsive'), no('errorFromClosedEmployer')),
          route: {
            kind: 'employer_message',
            href: '/fix/records_agree?route=employer',
            actor: 'employer',
            latencyDays: 10,
            label: 'Employer raises the correction on the Employer Portal',
          },
        },
        {
          when: always,
          route: {
            kind: 'joint_declaration',
            href: '/fix/records_agree?route=joint-declaration',
            actor: 'epfo',
            latencyDays: 21,
            label: 'Joint Declaration with Aadhaar, PAN and birth certificate',
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
          },
        },
        {
          when: always,
          route: {
            kind: 'walkthrough',
            href: '/fix/exit_marked?route=self',
            actor: 'you',
            latencyDays: 9,
            label: 'Mark exit yourself after 2 months, with Aadhaar OTP',
          },
        },
      ],
    },

    {
      id: 'service_history',
      title: 'Service history clean',
      blocks: 'Pension service reads short, and a second UAN splits your record.',
      // identity has to match before EPFO will merge anything — hence the dependency
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
          },
        },
      ],
    },

    {
      id: 'form_selected',
      title: 'Correct form chosen',
      blocks: 'Filing the wrong form is the single biggest cause of rejection.',
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
            latencyDays: 0, // three questions
            label: 'Answer three questions and we name the form',
          },
        },
      ],
    },

    {
      id: 'attachments',
      title: 'Form 15G attached',
      blocks: 'TDS is deducted, and the claim can be returned for the missing PDF.',
      clears: yes('form15gAttached'),
      // only required under 5 years of service on a balance above Rs 50,000
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
          },
        },
      ],
    },
  ],
};
