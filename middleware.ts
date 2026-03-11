import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Demo Mode Bypass: Allow requests with ?demo=true or a demo cookie to pass through without auth
  const isDemo = request.nextUrl.searchParams.get('demo') === 'true' || request.cookies.has('demo');
  if (isDemo) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

