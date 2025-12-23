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
    // PRIMARY CHECK: Use user object from session (most reliable)
    const isEmailConfirmedFromSession = user.email_confirmed_at !== null && user.email_confirmed_at !== undefined;
    
    try {
      // Use service role client to check user status (as fallback/verification)
      // Wrap in try-catch to handle missing service role key gracefully
      let adminSupabase;
      try {
        adminSupabase = createServiceRoleClient();
      } catch (adminClientError: any) {
        // If service role key is missing, skip admin checks and use session data
        console.warn('Service role client not available in middleware:', adminClientError?.message);
        adminSupabase = null;
      }

      if (adminSupabase) {
        const { data: userData, error: adminError } = await adminSupabase.auth.admin.getUserById(user.id);

        if (adminError || !userData?.user) {
          // If admin check fails but session says user exists, trust session
          // Only clear session if we're certain user doesn't exist
          if (adminError && adminError.message?.includes('not found')) {
            await supabase.auth.signOut();
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = '/login';
            redirectUrl.searchParams.set('error', 'session_expired');
            return NextResponse.redirect(redirectUrl);
          }
          // Otherwise, continue with session user
        } else {
          // CRITICAL: Check if user is deleted (from admin data - source of truth)
          if (userData.user.deleted_at !== null && userData.user.deleted_at !== undefined) {
            // User is deleted - clear session and redirect to login
            await supabase.auth.signOut();
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = '/login';
            redirectUrl.searchParams.set('error', 'account_deleted');
            return NextResponse.redirect(redirectUrl);
          }

          // Use admin data for email confirmation if available (more reliable)
          const isEmailConfirmed = userData.user.email_confirmed_at !== null && userData.user.email_confirmed_at !== undefined;
          
          // CRITICAL: Check if email is confirmed (only for protected routes)
          const pathname = request.nextUrl.pathname;
          const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/auth/callback');
          const isApiRoute = pathname.startsWith('/api');
          const isPublicRoute = pathname === '/terms' || pathname === '/privacy';
          const isLandingPage = pathname === '/';

          if (!isAuthRoute && !isApiRoute && !isPublicRoute && !isLandingPage) {
            // Protected route - require email confirmation
            if (!isEmailConfirmed) {
              // Email not confirmed - redirect to login with message
              const redirectUrl = request.nextUrl.clone();
              redirectUrl.pathname = '/login';
              redirectUrl.searchParams.set('error', 'email_not_confirmed');
              return NextResponse.redirect(redirectUrl);
            }
          }
        }
      }
    } catch (error) {
      // On error, use session user data as fallback
      console.error('Middleware user check error:', error);
      
      // If admin check fails, use session data
      const pathname = request.nextUrl.pathname;
      const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/auth/callback');
      const isApiRoute = pathname.startsWith('/api');
      const isPublicRoute = pathname === '/terms' || pathname === '/privacy';
      const isLandingPage = pathname === '/';

      if (!isAuthRoute && !isApiRoute && !isPublicRoute && !isLandingPage) {
        // Protected route - check from session
        if (!isEmailConfirmedFromSession) {
          // Email not confirmed - redirect to login with message
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = '/login';
          redirectUrl.searchParams.set('error', 'email_not_confirmed');
          return NextResponse.redirect(redirectUrl);
        }
      }
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

  // If user is logged in and visits landing page, redirect to dashboard (they should stay logged in)
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

  // Check if profile is complete - redirect to profile edit if incomplete
  // Required fields: name, phone_number, user_type
  if (user && !isApiRoute && !isProfileEditRoute && !isLogoutRoute && !isDemoMode) {
    try {
      // Try to get profile with all required fields
      let profile: any = null;
      const { data: profileWithPhone, error: errorWithPhone } = await supabase
        .from('profiles')
        .select('name, phone_number, user_type')
        .eq('user_id', user.id)
        .maybeSingle();

      if (errorWithPhone && errorWithPhone.message?.includes('phone_number')) {
        // phone_number column doesn't exist - select without it
        const { data: profileWithoutPhone, error: errorWithoutPhone } = await supabase
          .from('profiles')
          .select('name, user_type')
          .eq('user_id', user.id)
          .maybeSingle();
        
        profile = profileWithoutPhone;
        if (profile) {
          profile.phone_number = null;
        }
      } else {
        profile = profileWithPhone;
      }

      // Check if profile is complete
      const hasName = profile?.name && profile.name.trim().length > 0;
      const hasPhone = profile?.phone_number && profile.phone_number.trim().length > 0;
      const hasUserType = profile?.user_type && ['SkillSeeker', 'SkillHolder', 'Both'].includes(profile.user_type);

      // If profile doesn't exist or any required field is missing, redirect to profile edit
      if (!profile || !hasName || !hasPhone || !hasUserType) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/profile/edit';
        redirectUrl.searchParams.set('setup', 'true');
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      // If there's an error (like table doesn't exist), allow through
      // The app will handle it gracefully
      console.error('Error checking profile completeness in middleware:', error);
    }
  }

  return supabaseResponse;
}

