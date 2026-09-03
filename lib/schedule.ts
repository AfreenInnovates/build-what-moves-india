import type { GateId, Resolution, ResolvedGate } from './gates/types';

/**
 * When each remaining gate can start, when it finishes, and what clearing it is
 * actually worth.
 *
 * The resolver already computes a critical path and marks `onCriticalPath` on
 * every gate. What it does not hand back is the shape of the schedule - where
 * each gate sits on the calendar, which ones overlap, and how much the total
 * would move if one of them went green today. All three come out of the same
 * graph, so they are derived here rather than stored.
 *
 * Pure, like the resolver: a resolution goes in, a schedule comes out. No I/O,
 * no dates, no randomness, so the numbers on the timeline are as testable as the
 * countdown they explain.
 */

const unresolved = (g: ResolvedGate) => g.status === 'red' || g.status === 'blocked';

/**
 * Longest chain through the still-unresolved gates, optionally pretending one of
 * them has already cleared.
 *
 * `resolution.gates` arrives in topological order, so every dependency has been
 * given a finish time before anything that depends on it is read - one pass is
 * enough.
 */
function criticalLength(gates: ResolvedGate[], asIfCleared?: GateId): number {
  const live = new Set<GateId>();
  for (const g of gates) if (unresolved(g) && g.id !== asIfCleared) live.add(g.id);

  const finish = new Map<GateId, number>();
  let longest = 0;

  for (const g of gates) {
    if (!live.has(g.id)) continue;
    // a dependency that is green (or is the one we are pretending away) imposes
    // no wait at all, so it contributes nothing to this gate's start
    let start = 0;
    for (const d of g.dependsOn) {
      if (!live.has(d)) continue;
      start = Math.max(start, finish.get(d) ?? 0);
    }
    const end = start + g.latencyDays;
    finish.set(g.id, end);
    if (end > longest) longest = end;
  }

  return longest;
}

export interface ScheduleBar {
  gate: ResolvedGate;
  /** working day this can begin, counting from today */
  start: number;
  /** working day it is done */
  end: number;
  /** which track to draw it on - lane 0 is the critical chain */
  lane: number;
  /**
   * Working days the total drops by if this one gate clears.
   *
   * Not the same as its own length. Removing a ten-day blocker with a seven-day
   * blocker underneath it saves three days, because the seven-day one takes over
   * as the constraint. Anything with slack saves zero, which is the single most
   * useful thing this product can tell somebody.
   */
  savedIfCleared: number;
  /**
   * Working days this can sit untouched before it starts pushing the total out.
   *
   * This is the number that answers "but I still have to wait those days". The
   * latency does not disappear when you act - it is already counted in the
   * total. What you control is WHEN the wait starts. A gate on the critical path
   * has zero slack, so every day of delay adds a day to the answer. A gate with
   * four days of slack can be left for four days and cost nothing, because it
   * finishes inside somebody else's wait either way.
   */
  slack: number;
}

export interface Schedule {
  bars: ScheduleBar[];
  /** working days of waiting still ahead, before the settlement floor */
  span: number;
  /** EPFO's own settlement time once everything is green */
  baselineDays: number;
  totalDays: number;
  laneCount: number;
  /** true when at least one remaining gate costs no extra calendar time */
  hasSlack: boolean;
}

export function schedule(r: Resolution): Schedule | null {
  const live = r.gates.filter(unresolved);
  if (live.length === 0) return null;

  const span = criticalLength(r.gates);
  // totalDays is the baseline plus the critical path, so the settlement floor
  // falls out of the two numbers rather than needing the spec passed in
  const baselineDays = Math.max(0, r.totalDays - span);

  // earliest start for every remaining gate, same single pass as above
  const liveIds = new Set(live.map((g) => g.id));
  const finish = new Map<GateId, number>();
  const startOf = new Map<GateId, number>();

  for (const g of r.gates) {
    if (!liveIds.has(g.id)) continue;
    let start = 0;
    for (const d of g.dependsOn) {
      if (!liveIds.has(d)) continue;
      start = Math.max(start, finish.get(d) ?? 0);
    }
    startOf.set(g.id, start);
    finish.set(g.id, start + g.latencyDays);
  }

  // Backward pass for float: the latest each gate could finish without pushing
  // the span out. r.gates is topologically ordered, so walking it in reverse
  // settles every dependent before the gate it depends on.
  const dependents = new Map<GateId, GateId[]>();
  const byId = new Map(r.gates.map((g) => [g.id, g]));
  for (const g of live) {
    for (const d of g.dependsOn) {
      if (!liveIds.has(d)) continue;
      dependents.set(d, [...(dependents.get(d) ?? []), g.id]);
    }
  }

  const latestFinish = new Map<GateId, number>();
  for (const g of [...r.gates].reverse()) {
    if (!liveIds.has(g.id)) continue;
    const after = dependents.get(g.id) ?? [];
    if (after.length === 0) {
      latestFinish.set(g.id, span);
      continue;
    }
    let latest = Infinity;
    for (const d of after) {
      const dLatestStart = (latestFinish.get(d) ?? span) - (byId.get(d)?.latencyDays ?? 0);
      if (dLatestStart < latest) latest = dLatestStart;
    }
    latestFinish.set(g.id, latest);
  }

  const bars: ScheduleBar[] = live.map((gate) => ({
    gate,
    start: startOf.get(gate.id) ?? 0,
    end: finish.get(gate.id) ?? 0,
    lane: 0,
    savedIfCleared: Math.max(0, span - criticalLength(r.gates, gate.id)),
    slack: Math.max(0, (latestFinish.get(gate.id) ?? span) - (finish.get(gate.id) ?? 0)),
  }));

  // The critical chain is sequential by construction, so it tiles along lane 0
  // and reads as one unbroken spine. Everything else is packed underneath into
  // the first lane it fits in, which puts the slack visibly below the chain and
  // visibly ending before it does.
  let laneCount = 1;
  const laneEnds: number[] = [0];

  for (const bar of bars) {
    if (bar.gate.onCriticalPath) {
      bar.lane = 0;
      laneEnds[0] = Math.max(laneEnds[0], bar.end);
    }
  }

  for (const bar of bars.filter((b) => !b.gate.onCriticalPath).sort((a, b) => a.start - b.start)) {
    let lane = 1;
    while (lane < laneEnds.length && (laneEnds[lane] ?? 0) > bar.start) lane++;
    bar.lane = lane;
    laneEnds[lane] = bar.end;
    laneCount = Math.max(laneCount, lane + 1);
  }

  bars.sort((a, b) => a.lane - b.lane || a.start - b.start);

  return {
    bars,
    span,
    baselineDays,
    totalDays: r.totalDays,
    laneCount,
    hasSlack: bars.some((b) => b.savedIfCleared === 0),
  };
}

/** What clearing each gate is worth, for the cards in the action list. */
export function savings(r: Resolution): Map<GateId, number> {
  const span = criticalLength(r.gates);
  const out = new Map<GateId, number>();
  for (const g of r.gates) {
    if (!unresolved(g)) continue;
    out.set(g.id, Math.max(0, span - criticalLength(r.gates, g.id)));
  }
  return out;
}
