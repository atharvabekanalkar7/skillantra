import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { createAuthError, AuthErrorCode } from '@/lib/auth-errors';
import { isValidEmail, isUserDeleted, isEmailConfirmed, isValidIITMandiEmail } from '@/lib/auth-utils';

/**
 * Detects if an error is a network/connection timeout issue
 * (e.g., Supabase project paused, DNS failure, firewall block)
 */
function isConnectionError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const cause = error.cause;
  const causeMsg = (cause?.message || '').toLowerCase();
  const causeCode = cause?.code || '';

  return (
    msg.includes('fetch failed') ||
    msg.includes('connect timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('network') ||
    msg.includes('etimedout') ||
    msg.includes('authretryablefetcherror') ||
    causeMsg.includes('connect timeout') ||
    causeMsg.includes('econnrefused') ||
    causeMsg.includes('enotfound') ||
    causeMsg.includes('etimedout') ||
    causeCode === 'UND_ERR_CONNECT_TIMEOUT' ||
    causeCode === 'ECONNREFUSED' ||
    causeCode === 'ENOTFOUND' ||
    causeCode === 'ETIMEDOUT' ||
    error.name === 'AuthRetryableFetchError'
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.MISSING_FIELDS,
          'Email and password are required'
        ),
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        createAuthError(AuthErrorCode.INVALID_EMAIL, 'Invalid email format'),
        { status: 400 }
      );
    }

    // Validate IIT Mandi email domain strictly (acts as a dev to prod toggle gate)
    if (!isValidIITMandiEmail(email)) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.INVALID_EMAIL,
          "Only @students.iitmandi.ac.in and @iitmandi.ac.in email addresses are allowed to verify that student is actually from IIT Mandi."
        ),
        { status: 400 }
      );
    }

    // --- Create Supabase clients ---
    let supabase;
    try {
      supabase = await createClient();
    } catch (clientError: any) {
      console.error('Failed to create Supabase client:', clientError.message);
      if (isConnectionError(clientError)) {
        return NextResponse.json(
          createAuthError(
            AuthErrorCode.INTERNAL_ERROR,
            'Unable to connect to the authentication service. The server may be temporarily unavailable. Please try again in a few minutes.'
          ),
          { status: 503 }
        );
      }
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.INTERNAL_ERROR,
          'Failed to initialize authentication. Please check server configuration.'
        ),
        { status: 500 }
      );
    }

    // Try to create admin client - if it fails, we'll still attempt login
    let adminSupabase = null;
    try {
      adminSupabase = createServiceRoleClient();
    } catch (adminClientError: any) {
      console.error('Error creating admin client:', adminClientError.message);
      // Continue without admin client
    }

    // First, try to get user by email using admin client to check status (if available)
    let user = null;
    if (adminSupabase) {
      try {
        const { data: usersData, error: listUsersError } = await adminSupabase.auth.admin.listUsers();

        if (listUsersError) {
          // Check if this is a connection error
          if (isConnectionError(listUsersError)) {
            console.error('Supabase connection timeout during admin.listUsers:', listUsersError.message);
            return NextResponse.json(
              createAuthError(
                AuthErrorCode.INTERNAL_ERROR,
                'Unable to reach the authentication server. The database may be paused or temporarily unavailable. Please try again in a few minutes, or contact support if the issue persists.'
              ),
              { status: 503 }
            );
          }
          console.error('Error listing users in login:', listUsersError.message);
          // Continue with login attempt for non-connection errors
        } else {
          user = usersData?.users?.find(
            (u) => u.email?.toLowerCase() === email.toLowerCase() && u.deleted_at === null
          );
        }
      } catch (adminError: any) {
        if (isConnectionError(adminError)) {
          console.error('Supabase connection timeout during admin lookup:', adminError.message);
          return NextResponse.json(
            createAuthError(
              AuthErrorCode.INTERNAL_ERROR,
              'Unable to reach the authentication server. The database may be paused or temporarily unavailable. Please try again in a few minutes, or contact support if the issue persists.'
            ),
            { status: 503 }
          );
        }
        console.error('Error accessing admin client in login:', adminError.message);
        // Continue with login attempt for non-connection errors
      }
    }

    // If we found the user, check status before attempting login
    if (user) {
      // CRITICAL: Check if user is deleted
      if (user.deleted_at !== null && user.deleted_at !== undefined) {
        return NextResponse.json(
          createAuthError(
            AuthErrorCode.ACCOUNT_DELETED,
            'This account has been deleted. Please sign up again.'
          ),
          { status: 401 }
        );
      }

      // CRITICAL: Check if email is confirmed - BLOCK login if not confirmed
      if (!isEmailConfirmed(user)) {
        return NextResponse.json(
          createAuthError(
            AuthErrorCode.EMAIL_NOT_CONFIRMED,
            'Please verify email before signing in'
          ),
          { status: 403 }
        );
      }
    }

    // --- Attempt login ---
    let signInData;
    let signInError;
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      signInData = result.data;
      signInError = result.error;
    } catch (signInCatchError: any) {
      // Handle connection errors during sign-in
      if (isConnectionError(signInCatchError)) {
        console.error('Supabase connection timeout during signInWithPassword:', signInCatchError.message);
        return NextResponse.json(
          createAuthError(
            AuthErrorCode.INTERNAL_ERROR,
            'Unable to reach the authentication server. The database may be paused or temporarily unavailable. Please try again in a few minutes.'
          ),
          { status: 503 }
        );
      }
      throw signInCatchError; // Re-throw non-connection errors
    }

    if (signInError) {
      // Check for connection errors in the signInError itself
      if (isConnectionError(signInError)) {
        console.error('Supabase connection error during login:', signInError.message);
        return NextResponse.json(
          createAuthError(
            AuthErrorCode.INTERNAL_ERROR,
            'Unable to reach the authentication server. The database may be paused or temporarily unavailable. Please try again in a few minutes.'
          ),
          { status: 503 }
        );
      }

      // Handle email not confirmed error specifically
      if (signInError.message.includes('Email not confirmed') ||
        signInError.message.includes('email not confirmed') ||
        signInError.message.includes('email_confirmed_at')) {
        return NextResponse.json(
          createAuthError(
            AuthErrorCode.EMAIL_NOT_CONFIRMED,
            'Please verify email before signing in'
          ),
          { status: 403 }
        );
      }

      // Handle invalid credentials
      if (signInError.message.includes('Invalid login credentials') ||
        signInError.message.includes('invalid password') ||
        signInError.message.includes('Invalid password')) {
        return NextResponse.json(
          createAuthError(
            AuthErrorCode.INVALID_CREDENTIALS,
            'Invalid email or password'
          ),
          { status: 401 }
        );
      }

      // Log unexpected errors for debugging
      console.error('Unexpected signInError:', {
        message: signInError.message,
        status: signInError.status,
        name: signInError.name,
      });

      return NextResponse.json(
        createAuthError(
          AuthErrorCode.LOGIN_FAILED,
          signInError.message || 'Failed to log in. Please try again.'
        ),
        { status: 500 }
      );
    }

    if (!signInData.user || !signInData.session) {
      return NextResponse.json(
        createAuthError(AuthErrorCode.LOGIN_FAILED, 'Failed to create session'),
        { status: 500 }
      );
    }

    // Double-check user status after login (if admin client is available)
    if (adminSupabase) {
      try {
        // Double-check user is not deleted after login (race condition protection)
        const isDeleted = await isUserDeleted(signInData.user.id, adminSupabase);
        if (isDeleted) {
          await supabase.auth.signOut();
          return NextResponse.json(
            createAuthError(
              AuthErrorCode.ACCOUNT_DELETED,
              'This account has been deleted'
            ),
            { status: 401 }
          );
        }

        // CRITICAL: Double-check email is confirmed after login (defense in depth)
        const { data: freshUserData, error: freshUserError } = await adminSupabase.auth.admin.getUserById(signInData.user.id);
        if (freshUserError) {
          if (isConnectionError(freshUserError)) {
            // Connection lost mid-flow — don't crash, use signInData
            console.warn('Connection lost during post-login verification, using signInData check');
          } else {
            console.error('Error fetching fresh user data after login:', freshUserError);
            await supabase.auth.signOut();
            return NextResponse.json(
              createAuthError(
                AuthErrorCode.LOGIN_FAILED,
                'Failed to verify account status. Please try again.'
              ),
              { status: 500 }
            );
          }
        } else if (!freshUserData?.user || !isEmailConfirmed(freshUserData.user)) {
          await supabase.auth.signOut();
          return NextResponse.json(
            createAuthError(
              AuthErrorCode.EMAIL_NOT_CONFIRMED,
              'Please verify email before signing in'
            ),
            { status: 403 }
          );
        }
      } catch (postLoginError: any) {
        if (isConnectionError(postLoginError)) {
          console.warn('Connection error during post-login checks, proceeding with signInData verification');
          // Fall through to signInData-based check below
        } else {
          throw postLoginError;
        }
      }
    }

    // Fallback: check from signInData if admin wasn't available or had connection issues
    if (!adminSupabase || !isEmailConfirmed(signInData.user)) {
      if (!isEmailConfirmed(signInData.user)) {
        await supabase.auth.signOut();
        return NextResponse.json(
          createAuthError(
            AuthErrorCode.EMAIL_NOT_CONFIRMED,
            'Please verify email before signing in'
          ),
          { status: 403 }
        );
      }
    }

    // Check if profile exists, create if missing
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', signInData.user.id)
        .maybeSingle();

      if (!profile && signInData.user.user_metadata) {
        const { full_name, college } = signInData.user.user_metadata;
        if (full_name) {
          try {
            await supabase.from('profiles').insert({
              user_id: signInData.user.id,
              name: full_name,
              college: college || null,
            });
          } catch (profileError) {
            console.error('Profile auto-creation failed:', profileError);
          }
        }
      }
    } catch (profileCheckError) {
      // Don't fail login if profile check fails
      console.error('Profile check/creation failed:', profileCheckError);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: signInData.user.id,
        email: signInData.user.email,
        email_confirmed: isEmailConfirmed(signInData.user),
      },
      session: {
        access_token: signInData.session.access_token,
        expires_at: signInData.session.expires_at,
      },
    });
  } catch (error: any) {
    console.error('Login endpoint error:', {
      message: error?.message,
      name: error?.name,
      cause: error?.cause ? {
        message: error.cause.message,
        code: error.cause.code,
      } : undefined,
    });

    // Detect connection/timeout errors and return 503 with clear message
    if (isConnectionError(error)) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.INTERNAL_ERROR,
          'Unable to reach the authentication server. The database may be paused or temporarily unavailable. Please try again in a few minutes, or check your Supabase project status at https://supabase.com/dashboard.'
        ),
        { status: 503 }
      );
    }

    // Provide more specific error messages based on error type
    let errorMessage = 'An unexpected error occurred during login';
    if (error?.message) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else {
        errorMessage = `Login failed: ${error.message}`;
      }
    }

    return NextResponse.json(
      createAuthError(
        AuthErrorCode.INTERNAL_ERROR,
        errorMessage
      ),
      { status: 500 }
    );
  }
}
