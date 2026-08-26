import type { CaseFacts, FactKey, Predicate } from './types';
import { evaluate } from './predicate';

export interface Check {
  /** what is being checked, in plain words */
  label: string;
  /** what your record actually says */
  actual: string;
  ok: boolean;
}

/**
 * Turns a gate's condition into the list of things it actually checked, with
 * your own values beside each one.
 *
 * A green gate that just says "Cleared" is asking to be trusted. Showing the
 * four checks it passed, and what your record says for each, means a cleared
 * gate is as inspectable as a blocked one.
 */
const FIELD: Partial<Record<FactKey, { name: string; show: (f: CaseFacts) => string }>> = {
  uanActive: { name: 'Your UAN is activated', show: (f) => (f.uanActive ? 'Activated' : 'Not activated') },
  aadhaarLinked: {
    name: 'Your Aadhaar is linked and checked',
    show: (f) => (f.aadhaarLinked ? 'Linked' : 'Not linked'),
  },
  eNominationFiled: {
    name: 'You have named who should receive this money',
    show: (f) => (f.eNominationFiled ? 'Filed' : 'Not filed'),
  },
  exitMarked: {
    name: 'Your last working day is on record',
    show: (f) => (f.exitMarked ? 'Recorded' : 'Missing'),
  },
  stillEmployed: {
    name: 'You have left that job',
    show: (f) => (f.stillEmployed ? 'Still employed there' : 'Left'),
  },
  blockingMismatches: {
    name: 'Your details match on Aadhaar, PAN, bank and EPFO',
    show: (f) =>
      f.blockingMismatches === 0
        ? 'All four match'
        : f.blockingMismatches === 1
          ? '1 field does not match'
          : `${f.blockingMismatches} fields do not match`,
  },
  distinctUanCount: {
    name: 'You have only one UAN number',
    show: (f) => (f.distinctUanCount > 1 ? `${f.distinctUanCount} UANs found` : 'One UAN'),
  },
  serviceGapMonths: {
    name: 'No gaps in your work record that nobody can explain',
    show: (f) =>
      f.serviceGapMonths === 0
        ? 'No gaps'
        : f.serviceGapMonths === 1
          ? '1 month missing'
          : `${f.serviceGapMonths} months missing`,
  },
  continuousServiceMonths: {
    name: 'Time worked without a break at this job',
    show: (f) => `${f.continuousServiceMonths} months`,
  },
  totalEpsServiceMonths: {
    name: 'Total years that count towards your pension',
    show: (f) => `${f.totalEpsServiceMonths} months`,
  },
  balanceRupees: {
    name: 'How much you are claiming',
    show: (f) => `Rs ${f.balanceRupees.toLocaleString('en-IN')}`,
  },
  formSelected: {
    name: 'You have picked which claim form to use',
    show: (f) => (f.formSelected ? 'Chosen' : 'Not chosen yet'),
  },
  form15gAttached: {
    name: 'Form 15G attached, so tax is not cut',
    show: (f) => (f.form15gAttached ? 'Attached' : 'Not attached'),
  },
  employerResponsive: {
    name: 'Your company replies when contacted',
    show: (f) => (f.employerResponsive ? 'Reachable' : 'Not responding'),
  },
  errorFromClosedEmployer: {
    name: 'The mistake came from a company that has shut down',
    show: (f) => (f.errorFromClosedEmployer ? 'Yes' : 'No'),
  },
};

export function explain(pred: Predicate, facts: CaseFacts): Check[] {
  switch (pred.op) {
    case 'true':
      return [];
    case 'all':
    case 'any':
      return pred.of.flatMap((q) => explain(q, facts));
    case 'not':
      return explain(pred.of, facts).map((c) => ({ ...c, ok: !c.ok }));
    default: {
      const f = FIELD[pred.fact];
      return [
        {
          label: f?.name ?? String(pred.fact),
          actual: f?.show(facts) ?? String(facts[pred.fact]),
          ok: evaluate(pred, facts),
        },
      ];
    }
  }
}
