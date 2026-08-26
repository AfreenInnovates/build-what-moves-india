import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { caseIdFromCookie } from '@/lib/guard';

export const runtime = 'nodejs';

/** The conversation so far for the signed-in case. */
export async function GET() {
  const caseId = await caseIdFromCookie();
  // 200 with an empty list used to be the answer here, which told an
  // unauthenticated caller that the endpoint exists and works. Every other route
  // says 401; this one now agrees with them.
  if (!caseId) return NextResponse.json({ error: 'not signed in' }, { status: 401 });

  const messages = await query<{ role: string; content: string }>(
    `select role, content from chat_messages where case_id = $1 order by id limit 40`,
    [caseId],
  );
  return NextResponse.json({ messages });
}
