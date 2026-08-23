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
    name: 'Aadhaar is linked and verified',
    show: (f) => (f.aadhaarLinked ? 'Linked' : 'Not linked'),
  },
  eNominationFiled: {
    name: 'An e-Nomination is on file',
    show: (f) => (f.eNominationFiled ? 'Filed' : 'Not filed'),
  },
  exitMarked: {
    name: 'Your date of exit is recorded',
    show: (f) => (f.exitMarked ? 'Recorded' : 'Missing'),
  },
  stillEmployed: {
    name: 'You have left that employer',
    show: (f) => (f.stillEmployed ? 'Still employed there' : 'Left'),
  },
  blockingMismatches: {
    name: 'Aadhaar, PAN, bank and EPFO agree',
    show: (f) =>
      f.blockingMismatches === 0
        ? 'All four agree'
        : `${f.blockingMismatches} field${f.blockingMismatches === 1 ? '' : 's'} disagree`,
  },
  distinctUanCount: {
    name: 'You have a single UAN',
    show: (f) => (f.distinctUanCount > 1 ? `${f.distinctUanCount} UANs found` : 'One UAN'),
  },
  serviceGapMonths: {
    name: 'No unexplained break in service',
    show: (f) => (f.serviceGapMonths > 0 ? `${f.serviceGapMonths} months unaccounted` : 'Continuous'),
  },
  continuousServiceMonths: {
    name: 'Continuous service with this employer',
    show: (f) => `${f.continuousServiceMonths} months`,
  },
  totalEpsServiceMonths: {
    name: 'Total pensionable service',
    show: (f) => `${f.totalEpsServiceMonths} months`,
  },
  balanceRupees: {
    name: 'Amount being claimed',
    show: (f) => `Rs ${f.balanceRupees.toLocaleString('en-IN')}`,
  },
  formSelected: {
    name: 'A claim form has been chosen',
    show: (f) => (f.formSelected ? 'Chosen' : 'Not chosen yet'),
  },
  form15gAttached: {
    name: 'Form 15G is attached',
    show: (f) => (f.form15gAttached ? 'Attached' : 'Not attached'),
  },
  employerResponsive: {
    name: 'Your employer responds',
    show: (f) => (f.employerResponsive ? 'Reachable' : 'Not responding'),
  },
  errorFromClosedEmployer: {
    name: 'The error came from a closed employer',
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
