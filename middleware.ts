import { NextResponse, type NextRequest } from 'next/server';
import { SECURE_COOKIE } from '@/lib/deploy';

/**
 * A shared /c/<uuid> link still resumes a case — it sets the id in an httpOnly
 * cookie and redirects to /dashboard, so the identifier never sits in the
 * address bar, in browser history, or in a Referer header sent to a third party.
 */
export function middleware(req: NextRequest) {
  const match = req.nextUrl.pathname.match(/^\/c\/([0-9a-f-]{36})$/i);
  if (!match) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/dashboard';
  url.search = '';

  const res = NextResponse.redirect(url);
  res.cookies.set('case_id', match[1], {
    httpOnly: true,
    sameSite: 'lax',
    secure: SECURE_COOKIE,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export const config = { matcher: '/c/:path*' };
