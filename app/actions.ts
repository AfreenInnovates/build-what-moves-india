'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { startCase, applyFix, createOwnProfile, resetAllCases } from '@/lib/case';
import type { GateId } from '@/lib/gates/types';
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
export async function resetAllExamples() {
  await resetAllCases();
  revalidatePath('/', 'layout');
  redirect('/login?reset=1');
}
