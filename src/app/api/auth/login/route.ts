import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { createAuthError, AuthErrorCode } from '@/lib/auth-errors';
import { isValidEmail, isUserDeleted, isEmailConfirmed } from '@/lib/auth-utils';

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

    const supabase = await createClient();
    
    // Try to create admin client - if it fails, we'll still attempt login
    let adminSupabase = null;
    try {
      adminSupabase = createServiceRoleClient();
    } catch (adminClientError: any) {
      console.error('Error creating admin client:', adminClientError);
      // Continue without admin client - we'll check email confirmation after login
    }

    // First, try to get user by email using admin client to check status (if available)
    let user = null;
    if (adminSupabase) {
      try {
        const { data: usersData, error: listUsersError } = await adminSupabase.auth.admin.listUsers();
        
        if (listUsersError) {
          console.error('Error listing users in login:', listUsersError);
          // Continue with login attempt - will handle invalid credentials from Supabase
        } else {
          user = usersData?.users?.find(
            (u) => u.email?.toLowerCase() === email.toLowerCase() && u.deleted_at === null
          );
        }
      } catch (adminError: any) {
        console.error('Error accessing admin client in login:', adminError);
        // Continue with login attempt - will handle invalid credentials from Supabase
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
        // DO NOT attempt signInWithPassword - block immediately
        return NextResponse.json(
          createAuthError(
            AuthErrorCode.EMAIL_NOT_CONFIRMED,
            'Please verify email before signing in'
          ),
          { status: 403 }
        );
      }
    }
    // If user not found in admin list, continue to attempt login (might be a new user or admin API issue)

    // Only attempt login (email confirmation already checked above if user was found)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
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
      // Double-check user is not deleted after login (race condition protection)
      const isDeleted = await isUserDeleted(signInData.user.id, adminSupabase);
      if (isDeleted) {
        // Sign out immediately
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
      // Use admin client to get fresh user data to ensure email is confirmed
      const { data: freshUserData, error: freshUserError } = await adminSupabase.auth.admin.getUserById(signInData.user.id);
      if (freshUserError) {
        console.error('Error fetching fresh user data after login:', freshUserError);
        // If we can't verify, sign out for safety
        await supabase.auth.signOut();
        return NextResponse.json(
          createAuthError(
            AuthErrorCode.LOGIN_FAILED,
            'Failed to verify account status. Please try again.'
          ),
          { status: 500 }
        );
      }
      
      if (!freshUserData?.user || !isEmailConfirmed(freshUserData.user)) {
        // Email not confirmed - immediately sign out and block
        await supabase.auth.signOut();
        return NextResponse.json(
          createAuthError(
            AuthErrorCode.EMAIL_NOT_CONFIRMED,
            'Please verify email before signing in'
          ),
          { status: 403 }
        );
      }
    } else {
      // If admin client is not available, check email confirmation from signInData
      if (!isEmailConfirmed(signInData.user)) {
        // Email not confirmed - immediately sign out and block
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', signInData.user.id)
      .maybeSingle();

    if (!profile && signInData.user.user_metadata) {
      // Auto-create profile from metadata
      const { full_name, college } = signInData.user.user_metadata;
      if (full_name) {
        try {
          await supabase.from('profiles').insert({
            user_id: signInData.user.id,
            name: full_name,
            college: college || null,
          });
        } catch (profileError) {
          // Profile creation failed - user will be prompted to create profile
          console.error('Profile auto-creation failed:', profileError);
        }
      }
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
      stack: error?.stack,
      name: error?.name,
      error: error,
    });
    
    // Provide more specific error messages based on error type
    let errorMessage = 'An unexpected error occurred during login';
    if (error?.message) {
      // If it's a known error, provide more context
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

