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
    const adminSupabase = createServiceRoleClient();

    // First, try to get user by email using admin client to check status
    const { data: usersData } = await adminSupabase.auth.admin.listUsers();
    const user = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.INVALID_CREDENTIALS,
          'Invalid email or password'
        ),
        { status: 401 }
      );
    }

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

    // CRITICAL: Check if email is confirmed
    if (!isEmailConfirmed(user)) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.EMAIL_NOT_CONFIRMED,
          'Please confirm your email address before logging in. Check your inbox for the confirmation link.'
        ),
        { status: 403 }
      );
    }

    // Attempt login with regular client
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Handle specific errors
      if (signInError.message.includes('Invalid login credentials') || 
          signInError.message.includes('invalid password') ||
          signInError.message.includes('Email not confirmed')) {
        return NextResponse.json(
          createAuthError(
            AuthErrorCode.INVALID_CREDENTIALS,
            'Invalid email or password'
          ),
          { status: 401 }
        );
      }

      return NextResponse.json(
        createAuthError(
          AuthErrorCode.LOGIN_FAILED,
          signInError.message || 'Failed to log in'
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

    // Verify email is still confirmed
    if (!isEmailConfirmed(signInData.user)) {
      await supabase.auth.signOut();
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.EMAIL_NOT_CONFIRMED,
          'Please confirm your email address'
        ),
        { status: 403 }
      );
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
    console.error('Login endpoint error:', error);
    return NextResponse.json(
      createAuthError(
        AuthErrorCode.INTERNAL_ERROR,
        'An unexpected error occurred during login'
      ),
      { status: 500 }
    );
  }
}

