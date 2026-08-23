'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { startCase, applyFix, resetCase, startSelfCase, type SelfAnswers } from '@/lib/case';
import type { GateId } from '@/lib/gates/types';

export async function signIn(formData: FormData) {
  const slug = String(formData.get('slug') ?? '');
  const caseId = await startCase(slug);
  if (!caseId) redirect('/login?error=unknown');
  redirect(`/c/${caseId}`);
}

export async function fixGate(formData: FormData) {
  const caseId = String(formData.get('caseId') ?? '');
  const gateId = String(formData.get('gateId') ?? '') as GateId;
  await applyFix(caseId, gateId);
  revalidatePath(`/c/${caseId}`, 'layout');
}

export async function resetProgress(formData: FormData) {
  const caseId = String(formData.get('caseId') ?? '');
  await resetCase(caseId);
  revalidatePath(`/c/${caseId}`, 'layout');
  redirect(`/c/${caseId}`);
}

export async function buildOwnCase(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? 'unsure');
  const caseId = await startSelfCase({
    name: get('name'),
    uanActive: get('uanActive'),
    employment: get('employment'),
    tenure: get('tenure'),
    balance: get('balance'),
    nomination: get('nomination'),
    recordsMatch: get('recordsMatch'),
    employer: get('employer'),
  } as SelfAnswers);
  redirect(`/c/${caseId}`);
}
