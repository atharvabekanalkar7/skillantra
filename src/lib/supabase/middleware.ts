import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

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

  // CRITICAL: Check if user is deleted or email not confirmed
  if (user) {
    try {
      // Use service role client to check user status
      const adminSupabase = createServiceRoleClient();

      const { data: userData, error: adminError } = await adminSupabase.auth.admin.getUserById(user.id);

      if (adminError || !userData?.user) {
        // User doesn't exist or error - clear session
        await supabase.auth.signOut();
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/login';
        redirectUrl.searchParams.set('error', 'session_expired');
        return NextResponse.redirect(redirectUrl);
      }

      // CRITICAL: Check if user is deleted
      if (userData.user.deleted_at !== null && userData.user.deleted_at !== undefined) {
        // User is deleted - clear session and redirect to login
        await supabase.auth.signOut();
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/login';
        redirectUrl.searchParams.set('error', 'account_deleted');
        return NextResponse.redirect(redirectUrl);
      }

      // CRITICAL: Check if email is confirmed (only for protected routes)
      const pathname = request.nextUrl.pathname;
      const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/auth/callback');
      const isApiRoute = pathname.startsWith('/api');
      const isPublicRoute = pathname === '/terms' || pathname === '/privacy';
      const isLandingPage = pathname === '/';

      if (!isAuthRoute && !isApiRoute && !isPublicRoute && !isLandingPage) {
        // Protected route - require email confirmation
        if (!userData.user.email_confirmed_at) {
          // Email not confirmed - redirect to login with message
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = '/login';
          redirectUrl.searchParams.set('error', 'email_not_confirmed');
          return NextResponse.redirect(redirectUrl);
        }
      }
    } catch (error) {
      // On error, log but don't block (might be rate limiting or network issue)
      console.error('Middleware user check error:', error);
      // Continue with request - API routes will handle validation
    }
  }

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/auth/callback');
  const isApiRoute = pathname.startsWith('/api');
  const isLandingPage = pathname === '/';
  const isDemoMode = request.nextUrl.searchParams.get('demo') === 'true';
  const isProfileEditRoute = pathname.startsWith('/profile/edit');
  const isLogoutRoute = pathname.startsWith('/logout');
  const isPublicRoute = pathname === '/terms' || pathname === '/privacy';

  // If user is logged in and visits landing page, redirect to dashboard (don't log them out)
  if (user && isLandingPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // Allow landing page, demo mode, and public routes without auth
  if (isLandingPage || isDemoMode || isPublicRoute) {
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

