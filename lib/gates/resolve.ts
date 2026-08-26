import type {
  CaseFacts, Gate, GateId, GateSpec, GateStatus, ResolvedGate, Resolution, FixRoute,
} from './types';
import { evaluate } from './predicate';

/**
 * Pure. Facts in, ordered gates and a number of days out. No I/O, no dates, no
 * randomness - which is what makes the countdown testable.
 */
export function resolve(spec: GateSpec, facts: CaseFacts): Resolution {
  const ordered = topoSort(spec.gates);

  const status = new Map<GateId, GateStatus>();
  const route = new Map<GateId, FixRoute | null>();

  for (const gate of ordered) {
    if (!evaluate(gate.appliesWhen, facts)) {
      status.set(gate.id, 'not_applicable');
      route.set(gate.id, null);
      continue;
    }
    if (evaluate(gate.clears, facts)) {
      status.set(gate.id, 'green');
      route.set(gate.id, null);
      continue;
    }
    // first matching route wins; the spec guarantees a final always-true entry
    const match = gate.routes.find((r) => evaluate(r.when, facts));
    if (!match) throw new Error(`gate "${gate.id}" has no matching route - spec is incomplete`);
    route.set(gate.id, match.route);

    // you cannot act on a gate whose prerequisites are themselves unresolved
    const waiting = gate.dependsOn.some((d) => {
      const s = status.get(d);
      return s === 'red' || s === 'blocked';
    });
    status.set(gate.id, waiting ? 'blocked' : 'red');
  }

  // --- critical path over the unresolved sub-graph -------------------------
  // Fixing an off-path gate does not make the money arrive sooner. Saying so is
  // the difference between a checklist and advice.
  const unresolved = (id: GateId) => status.get(id) === 'red' || status.get(id) === 'blocked';
  const finish = new Map<GateId, number>();
  const viaDep = new Map<GateId, GateId | null>();

  for (const gate of ordered) {
    if (!unresolved(gate.id)) continue;
    let best = 0;
    let bestDep: GateId | null = null;
    for (const d of gate.dependsOn) {
      if (!unresolved(d)) continue;
      const f = finish.get(d) ?? 0;
      if (f > best) { best = f; bestDep = d; }
    }
    finish.set(gate.id, best + (route.get(gate.id)?.latencyDays ?? 0));
    viaDep.set(gate.id, bestDep);
  }

  let criticalPath = 0;
  let tail: GateId | null = null;
  for (const [id, f] of finish) {
    if (f > criticalPath) { criticalPath = f; tail = id; }
  }

  const onPath = new Set<GateId>();
  for (let cur = tail; cur; cur = viaDep.get(cur) ?? null) onPath.add(cur);

  const gates: ResolvedGate[] = ordered.map((gate, i) => ({
    id: gate.id,
    title: gate.title,
    problem: gate.problem,
    blocks: gate.blocks,
    status: status.get(gate.id)!,
    order: i,
    dependsOn: gate.dependsOn,
    route: route.get(gate.id) ?? null,
    actor: route.get(gate.id)?.actor ?? null,
    latencyDays: route.get(gate.id)?.latencyDays ?? 0,
    provenance: route.get(gate.id)?.provenance ?? null,
    onCriticalPath: onPath.has(gate.id),
  }));

  // start the longest-latency thing you can actually act on today
  const startToday =
    gates
      .filter((g) => g.status === 'red' && g.onCriticalPath)
      .sort((a, b) => b.latencyDays - a.latencyDays)[0]?.id ??
    gates.filter((g) => g.status === 'red').sort((a, b) => b.latencyDays - a.latencyDays)[0]?.id ??
    null;

  return {
    specVersion: spec.version,
    gates,
    totalDays: spec.baselineSettlementDays + criticalPath,
    blockingCount: gates.filter((g) => g.status === 'red' || g.status === 'blocked').length,
    startToday,
  };
}

/** Kahn's algorithm. Throws on a cycle so a bad spec fails loudly at boot. */
function topoSort(gates: Gate[]): Gate[] {
  const byId = new Map(gates.map((g) => [g.id, g]));
  const indegree = new Map<GateId, number>();
  const dependents = new Map<GateId, GateId[]>();

  for (const g of gates) {
    indegree.set(g.id, g.dependsOn.length);
    for (const d of g.dependsOn) {
      if (!byId.has(d)) throw new Error(`gate "${g.id}" depends on unknown gate "${d}"`);
      dependents.set(d, [...(dependents.get(d) ?? []), g.id]);
    }
  }

  // preserve authored order among ready gates so the spine reads top-to-bottom
  const ready = gates.filter((g) => indegree.get(g.id) === 0).map((g) => g.id);
  const out: Gate[] = [];

  while (ready.length) {
    const id = ready.shift()!;
    out.push(byId.get(id)!);
    for (const dep of dependents.get(id) ?? []) {
      const n = indegree.get(dep)! - 1;
      indegree.set(dep, n);
      if (n === 0) ready.push(dep);
    }
  }

  if (out.length !== gates.length) {
    const stuck = gates.filter((g) => !out.includes(g)).map((g) => g.id);
    throw new Error(`gate spec has a dependency cycle involving: ${stuck.join(', ')}`);
  }
  return out;
}
