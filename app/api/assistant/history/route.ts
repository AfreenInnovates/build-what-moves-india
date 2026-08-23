import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

/** The conversation so far for the signed-in case. */
export async function GET() {
  const caseId = (await cookies()).get('case_id')?.value;
  if (!caseId) return NextResponse.json({ messages: [] });

  const messages = await query<{ role: string; content: string }>(
    `select role, content from chat_messages where case_id = $1 order by id limit 40`,
    [caseId],
  );
  return NextResponse.json({ messages });
}
