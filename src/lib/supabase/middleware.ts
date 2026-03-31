import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { MAINTENANCE_MODE } from '@/config/app';

/**
 * Handle maintenance mode redirection
 */
export function handleMaintenanceMode(request: NextRequest) {
  if (!MAINTENANCE_MODE) return null;

  const pathname = request.nextUrl.pathname;
  const isDemoMode = request.nextUrl.searchParams.get('demo') === 'true' || request.cookies.has('demo');
  
  // Routes always allowed
  const isPublicAllowed = 
    pathname === '/' || 
    pathname === '/maintenance' || 
    pathname === '/join-waitlist' || 
    pathname === '/waitlist-success' ||
    pathname === '/waitlist-questions' ||
    pathname.startsWith('/_next') ||
    pathname.includes('/api/waitlist') ||
    pathname.includes('/SkillAntra-Logo.png') ||
    pathname.includes('/favicon.ico');

  // Block Auth completely
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
  if (isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/maintenance';
    return NextResponse.redirect(url);
  }

  // Allow app routes IF in demo mode
  if (isDemoMode) return null;

  // Otherwise block restricted routes
  const isRestrictedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/tasks') || 
    pathname.startsWith('/internships') || 
    pathname.startsWith('/messages') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/settings');

  if (isRestrictedRoute && !isPublicAllowed) {
    const url = request.nextUrl.clone();
    url.pathname = '/maintenance';
    return NextResponse.redirect(url);
  }

  return null;
}

/**
 * Quickly checks if an error is a connection/timeout issue.
 * When Supabase is unreachable (paused, DNS failure, firewall),
 * we must fail fast instead of blocking on 10s timeouts.
 */
function isConnectionError(error: any): boolean {
  if (!error) return false;
  const msg = (error?.message || '').toLowerCase();
  const cause = error?.cause;
  const causeCode = cause?.code || '';
  return (
    msg.includes('fetch failed') ||
    msg.includes('connect timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('etimedout') ||
    msg.includes('authretryablefetcherror') ||
    causeCode === 'UND_ERR_CONNECT_TIMEOUT' ||
    causeCode === 'ECONNREFUSED' ||
    causeCode === 'ENOTFOUND' ||
    causeCode === 'ETIMEDOUT' ||
    error.name === 'AuthRetryableFetchError'
  );
}

export async function updateSession(request: NextRequest) {
  const maintenanceResponse = handleMaintenanceMode(request);
  if (maintenanceResponse) return maintenanceResponse;

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing, skip auth entirely — let the app handle it
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Middleware: Supabase env vars missing, skipping auth check');
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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

  // Attempt to get user — if Supabase is unreachable, fail fast
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch (error: any) {
    if (isConnectionError(error)) {
      // Supabase is unreachable (paused/down/network issue)
      // Don't block: let the request through, the page/API will handle the error
      console.warn('Middleware: Supabase unreachable, skipping auth checks');
      return supabaseResponse;
    }
    console.error('Middleware: Unexpected error getting user:', error?.message);
    return supabaseResponse;
  }

  // If we have a user, check email confirmation using session data ONLY
  // (no admin API call — saves a full round-trip that can timeout)
  if (user) {
    const isEmailConfirmed = user.email_confirmed_at !== null && user.email_confirmed_at !== undefined;

    const pathname = request.nextUrl.pathname;
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/auth/callback');
    const isApiRoute = pathname.startsWith('/api');
    const isPublicRoute = pathname === '/terms' || pathname === '/privacy' || pathname === '/join-waitlist' || pathname === '/waitlist-success' || pathname === '/waitlist-questions';
    const isLandingPage = pathname === '/';
    const isDemoMode = request.nextUrl.searchParams.get('demo') === 'true' || request.cookies.has('demo');

    if (!isAuthRoute && !isApiRoute && !isPublicRoute && !isLandingPage && !isDemoMode) {
      if (!isEmailConfirmed) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/login';
        redirectUrl.searchParams.set('error', 'email_not_confirmed');
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/auth/callback');
  const isApiRoute = pathname.startsWith('/api');
  const isLandingPage = pathname === '/';
  const isDemoMode = request.nextUrl.searchParams.get('demo') === 'true' || request.cookies.has('demo');
  const isProfileEditRoute = pathname.startsWith('/profile/edit');
  const isCompleteProfileRoute = pathname.startsWith('/complete-profile');
  const isLogoutRoute = pathname.startsWith('/logout');
    const isPublicRoute = pathname === '/terms' || pathname === '/privacy' || pathname === '/join-waitlist' || pathname === '/waitlist-success' || pathname === '/waitlist-questions';

  // If user is logged in and visits landing page, redirect to dashboard IF approved
  if (user && isLandingPage) {
    const { data: waitlistEntry } = await supabase
      .from('waitlist_users')
      .select('status')
      .eq('email', user.email)
      .maybeSingle();

    if (waitlistEntry?.status === 'approved') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }
    // Otherwise keep them on landing page (where they can see their status or CTA is gone)
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

  // Check if profile is complete
  if (user && !isApiRoute && !isLogoutRoute && !isDemoMode && !isCompleteProfileRoute && !isPublicRoute) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_profile_complete, user_type')
        .eq('user_id', user.id)
        .maybeSingle();

      // STEP 8 — RESTRICT PLATFORM ACCESS
      // Check waitlist status
      const { data: waitlistEntry } = await supabase
        .from('waitlist_users')
        .select('status')
        .eq('email', user.email)
        .maybeSingle();

      const isApproved = waitlistEntry?.status === 'approved';

      if (!isApproved) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/';
        // Add a flag to show they are waitlisted if they try to access restricted areas
        if (pathname !== '/') {
           redirectUrl.searchParams.set('waitlist', 'true');
        }
        return NextResponse.redirect(redirectUrl);
      }

      const isComplete = profile?.is_profile_complete === true;

      if (!profile || !isComplete) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/complete-profile';
        return NextResponse.redirect(redirectUrl);
      }

      if (profile.user_type === 'recruiter') {
        const isRestrictedRoute = pathname.startsWith('/tasks') || pathname.startsWith('/applications') || pathname.startsWith('/collaborate');
        if (isRestrictedRoute) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = '/dashboard';
          return NextResponse.redirect(redirectUrl);
        }
      }
    } catch (error: any) {
      if (isConnectionError(error)) {
        console.warn('Middleware: Supabase unreachable during profile check, allowing through');
      } else {
        console.error('Error checking profile completeness in middleware:', error?.message);
      }
      // Allow through — the page will handle the error
    }
  }

  return supabaseResponse;
}
