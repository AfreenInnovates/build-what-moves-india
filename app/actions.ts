'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { startCase, applyFix } from '@/lib/case';
import type { GateId } from '@/lib/gates/types';

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

export async function signOut() {
  (await cookies()).delete(COOKIE);
  redirect('/login');
}

export async function fixGate(formData: FormData) {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const gateId = String(formData.get('gateId') ?? '') as GateId;
  await applyFix(caseId, gateId);
  revalidatePath('/dashboard', 'layout');
}
