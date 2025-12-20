import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/auth/callback');
  const isApiRoute = pathname.startsWith('/api');
  const isLandingPage = pathname === '/';
  const isDemoMode = request.nextUrl.searchParams.get('demo') === 'true';
  const isProfileEditRoute = pathname.startsWith('/profile/edit');
  const isLogoutRoute = pathname.startsWith('/logout');

  // If user is logged in and visits landing page, redirect to dashboard (don't log them out)
  if (user && isLandingPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // Allow landing page and demo mode routes without auth
  if (isLandingPage || isDemoMode) {
    return supabaseResponse;
  }

  if (!user && !isAuthRoute && !isApiRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // Check if user has phone number - redirect to profile edit if missing
  if (user && !isApiRoute && !isProfileEditRoute && !isLogoutRoute && !isDemoMode) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('user_id', user.id)
        .maybeSingle();

      // If profile doesn't exist or phone_number is missing, redirect to profile edit
      if (!profile || !profile.phone_number) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/profile/edit';
        redirectUrl.searchParams.set('phone_required', 'true');
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      // If there's an error (like table doesn't exist), allow through
      // The app will handle it gracefully
      console.error('Error checking phone number in middleware:', error);
    }
  }

  return supabaseResponse;
}

