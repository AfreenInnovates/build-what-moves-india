'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  startCase, applyFix, createOwnProfile, resetAllCases, loadCase, submitMockClaim,
  fileGrievance, simulateDisposal,
} from '@/lib/case';
import { LADDER, TYPICAL_DISPOSAL } from '@/lib/escalation';
import type { GateId } from '@/lib/gates/types';
import {
  employerFromToken,
  sendRequest,
  markDone,
  requestByRef,
} from '@/lib/employer';
import { SPEC } from '@/lib/gates/spec';

/** Gate ids the spec actually defines. A form field is not a promise. */
const GATE_IDS = new Set<string>(SPEC.gates.map((g) => g.id));

/**
 * A date Postgres will accept. Without this an unparseable string reaches a DATE
 * column and the insert throws, turning a typo in a form into a 500.
 */
function isoDate(v: FormDataEntryValue | null): string | undefined {
  const s = String(v ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : s;
}

const COOKIE = 'case_id';

/** The case id lives in an httpOnly cookie, never in the URL. */
export async function currentCaseId(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

export async function signIn(formData: FormData) {
  const slug = String(formData.get('slug') ?? '');
  const caseId = await startCase(slug);
  if (!caseId) redirect('/login?error=unknown');
  (await cookies()).set(COOKIE, caseId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect('/dashboard');
}

export async function startFreshProfile(formData: FormData) {
  const caseId = await createOwnProfile({
    name: String(formData.get('name') ?? '').trim() || 'New Member',
    dob: isoDate(formData.get('dob')),
    employer: String(formData.get('employer') ?? '').trim().slice(0, 80) || undefined,
    joined: isoDate(formData.get('joined')),
  });
  (await cookies()).set(COOKIE, caseId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect('/dashboard');
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
  redirect('/login');
}

export async function fixGate(formData: FormData) {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const gateId = String(formData.get('gateId') ?? '');
  // an unknown id used to fall through and write itself into the events table
  if (!GATE_IDS.has(gateId)) return;
  await applyFix(caseId, gateId as GateId);
  revalidatePath('/dashboard', 'layout');
}

/**
 * Restore every demo profile to how it started. Lives on the case picker rather
 * than inside a case, because it is a housekeeping action for whoever is showing
 * the product, not something a member would ever do to their own claim.
 */
/**
 * Complete a step from inside one of the rebuilt apps.
 *
 * Same effect as pressing "mark this done" on the gate page - the mock flow is a
 * nicer way to arrive at it, not a different code path. The gate id is checked
 * against the spec here too, because a server action is a public endpoint.
 */
export async function completeStep(gateId: string) {
  const caseId = await currentCaseId();
  if (!caseId) return;
  if (!GATE_IDS.has(gateId)) return;
  await applyFix(caseId, gateId as GateId);
  revalidatePath('/dashboard', 'layout');
}

/** The member sends one request to their old employer, and it is recorded. */
export async function sendEmployerRequest(formData: FormData) {
  const caseId = await currentCaseId();
  if (!caseId) return;
  const gateId = String(formData.get('gateId') ?? '');
  if (!GATE_IDS.has(gateId)) return;

  /*
   * Who the employer is comes from the case, never from the form.
   *
   * Taking the establishment name off the request meant a signed-in member
   * could post any company they liked and drop a request into that company's
   * queue - or invent a queue for a company that does not exist. The only
   * employer you can send to is the one on your own record.
   */
  const c = await loadCase(caseId).catch(() => null);
  if (!c?.member.employer_name) return;

  await sendRequest(caseId, gateId as GateId, c.member.employer_name, c.member.display_name);
  revalidatePath('/dashboard', 'layout');
}

/**
 * The employer acts on one member's request.
 *
 * No session is involved: whoever holds the link is treated as the employer,
 * exactly as an emailed action link works before it is signed. The establishment
 * comes out of the token rather than the request body, so a link can only ever
 * act on that employer's own queue.
 */
export async function employerAction(formData: FormData) {
  const employer = await employerFromToken(String(formData.get('token') ?? ''));
  const ref = String(formData.get('ref') ?? '');
  if (!employer) return;

  // the gate and the case both come from the stored request, never from the
  // form, so a link can only ever do the one thing it was created for
  const req = await requestByRef(employer, ref);
  if (!req || !GATE_IDS.has(req.gate_id)) return;

  await applyFix(req.case_id, req.gate_id);
  await markDone(employer, ref);
  revalidatePath('/employer', 'layout');
  revalidatePath('/dashboard', 'layout');
}

export async function resetAllExamples() {
  await resetAllCases();
  revalidatePath('/', 'layout');
  redirect('/login?reset=1');
}

export async function submitMockClaimAction() {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  await submitMockClaim(caseId);
  revalidatePath('/dashboard', 'layout');
}

/** Ladder ids the module actually defines. A form field is not a promise. */
const RUNG_IDS = new Set<string>(LADDER.map((r) => r.id));

export async function fileGrievanceAction(formData: FormData) {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const rung = String(formData.get('rung') ?? '');
  if (!RUNG_IDS.has(rung)) return;
  await fileGrievance(caseId, rung);
  revalidatePath('/dashboard', 'layout');
}

/**
 * Move the demo clock forward and let the reply arrive.
 *
 * Kept as an explicit action rather than a background timer: a simulated
 * deadline that passes while nobody is looking is indistinguishable from a
 * progress bar, and the whole point of this screen is that the member sees the
 * disposal happen and sees what it does not say.
 */
export async function advanceGrievanceClockAction(formData: FormData) {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const rung = String(formData.get('rung') ?? '');
  if (!RUNG_IDS.has(rung)) return;
  const days = Number(formData.get('days') ?? 30);
  await simulateDisposal(caseId, rung, Number.isFinite(days) ? days : 30, TYPICAL_DISPOSAL);
  revalidatePath('/dashboard', 'layout');
}
