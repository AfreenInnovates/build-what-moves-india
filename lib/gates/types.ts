/**
 * The gate spec is DATA, not code. Every predicate below is JSON-serialisable,
 * which is what makes the claim "adding a gate is a config change, not a release"
 * literally true — a spec can be stored in the `gate_specs` table, published by a
 * field office, and loaded at runtime without deploying anything.
 */

/** Facts about one member's case. Every key is a leaf value so predicates stay simple. */
export interface CaseFacts {
  uanActive: boolean;
  aadhaarLinked: boolean;
  eNominationFiled: boolean;
  exitMarked: boolean;
  stillEmployed: boolean;

  /** from the deterministic matcher — never from a model */
  blockingMismatches: number;

  distinctUanCount: number;
  serviceGapMonths: number;
  /** unbroken service with the employer being claimed against — drives Form 15G */
  continuousServiceMonths: number;
  /** every pensionable month across the whole record — drives EPS eligibility */
  totalEpsServiceMonths: number;
  balanceRupees: number;

  formSelected: boolean;
  form15gAttached: boolean;

  /** decides the employer-portal vs joint-declaration fork */
  employerResponsive: boolean;
  errorFromClosedEmployer: boolean;
}

export type FactKey = keyof CaseFacts;

export type Predicate =
  | { op: 'true' }
  | { op: 'is'; fact: FactKey; value: string | number | boolean }
  | { op: 'lt'; fact: FactKey; value: number }
  | { op: 'lte'; fact: FactKey; value: number }
  | { op: 'gt'; fact: FactKey; value: number }
  | { op: 'gte'; fact: FactKey; value: number }
  | { op: 'all'; of: Predicate[] }
  | { op: 'any'; of: Predicate[] }
  | { op: 'not'; of: Predicate };

export type GateId =
  | 'uan_active'
  | 'records_agree'
  | 'e_nomination'
  | 'exit_marked'
  | 'service_history'
  | 'form_selected'
  | 'attachments';

/** Who has to act. The real portal never tells you this, and it is the whole point. */
export type Actor = 'you' | 'employer' | 'epfo';

export type FixKind =
  | 'walkthrough'
  | 'scanner'
  | 'employer_message'
  | 'joint_declaration'
  | 'merge_uan'
  | 'form_picker'
  | 'upload';

export interface FixRoute {
  kind: FixKind;
  href: string;
  actor: Actor;
  /** working days this route costs once started */
  latencyDays: number;
  label: string;
}

/** First matching route wins; the last entry must have `when: {op:'true'}`. */
export interface ConditionalRoute {
  when: Predicate;
  route: FixRoute;
}

export interface Gate {
  id: GateId;
  title: string;
  /** one line naming what stays locked while this is red */
  blocks: string;
  /** green when this holds */
  clears: Predicate;
  /** gate is skipped entirely when this is false */
  appliesWhen: Predicate;
  dependsOn: GateId[];
  routes: ConditionalRoute[];
}

export interface GateSpec {
  version: string;
  /** working days a clean claim takes once every gate is green */
  baselineSettlementDays: number;
  gates: Gate[];
}

export type GateStatus =
  | 'green'          // cleared
  | 'red'            // blocking and actionable right now
  | 'blocked'        // blocking, but an upstream gate must clear first
  | 'not_applicable';

export interface ResolvedGate {
  id: GateId;
  title: string;
  blocks: string;
  status: GateStatus;
  order: number;
  dependsOn: GateId[];
  /** null when green or not applicable */
  route: FixRoute | null;
  actor: Actor | null;
  latencyDays: number;
  /** true when this gate sits on the critical path — i.e. fixing it moves the number */
  onCriticalPath: boolean;
}

export interface Resolution {
  specVersion: string;
  gates: ResolvedGate[];
  /** working days until settlement */
  totalDays: number;
  blockingCount: number;
  /** what to start today: longest-latency actionable gate on the critical path */
  startToday: GateId | null;
}
