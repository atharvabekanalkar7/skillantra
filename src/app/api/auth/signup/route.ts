import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createAuthError, AuthErrorCode } from '@/lib/auth-errors';
import { isValidEmail, isValidPassword, checkRateLimit, getClientIP, generateIdempotencyKey } from '@/lib/auth-utils';

// In-memory idempotency store (for production, use Redis)
const idempotencyStore = new Map<string, { response: any; timestamp: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name, college, idempotency_key } = body;

    // Validate required fields
    if (!email || !password || !full_name || !college) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.MISSING_FIELDS,
          'Missing required fields: email, password, full_name, and college are required'
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

    // Validate password
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        createAuthError(AuthErrorCode.WEAK_PASSWORD, passwordValidation.error || 'Invalid password'),
        { status: 400 }
      );
    }

    // Rate limiting per email
    const emailKey = `signup:email:${email.toLowerCase()}`;
    const emailLimit = checkRateLimit(emailKey, { max: 3, windowMs: 60 * 60 * 1000 });
    if (!emailLimit.allowed) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.RATE_LIMIT_EXCEEDED,
          `Too many signup attempts. Please try again after ${new Date(emailLimit.resetAt).toLocaleTimeString()}`
        ),
        { status: 429 }
      );
    }

    // Rate limiting per IP
    const clientIP = getClientIP(request);
    const ipKey = `signup:ip:${clientIP}`;
    const ipLimit = checkRateLimit(ipKey, { max: 10, windowMs: 60 * 60 * 1000 });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.RATE_LIMIT_EXCEEDED,
          'Too many signup attempts from this IP. Please try again later.'
        ),
        { status: 429 }
      );
    }

    // Idempotency check
    const idempotencyKey = idempotency_key || generateIdempotencyKey(email, Date.now());
    const cachedResponse = idempotencyStore.get(idempotencyKey);
    if (cachedResponse && Date.now() - cachedResponse.timestamp < 60000) {
      // Return cached response if within 1 minute
      return NextResponse.json(cachedResponse.response.data, { status: cachedResponse.response.status });
    }

    // Use service role client for admin operations
    const adminSupabase = createServiceRoleClient();

    // Check if email already exists
    const { data: existingUser } = await adminSupabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase() && u.deleted_at === null
    );

    if (userExists) {
      const errorResponse = createAuthError(
        AuthErrorCode.EMAIL_ALREADY_EXISTS,
        'An account with this email already exists. Please log in or use a different email.'
      );
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // Get base URL for email redirect
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const emailRedirectUrl = `${baseUrl}/auth/callback?next=/login`;

    // Create user with admin client
    const { data: signUpData, error: signUpError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email confirmation
      user_metadata: {
        full_name: full_name.trim(),
        college: college.trim(),
      },
    });

    if (signUpError) {
      console.error('Signup error:', signUpError);
      
      // Handle specific Supabase errors
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
        return NextResponse.json(
          createAuthError(
            AuthErrorCode.EMAIL_ALREADY_EXISTS,
            'An account with this email already exists'
          ),
          { status: 409 }
        );
      }

      return NextResponse.json(
        createAuthError(
          AuthErrorCode.SIGNUP_FAILED,
          signUpError.message || 'Failed to create account'
        ),
        { status: 500 }
      );
    }

    if (!signUpData.user) {
      return NextResponse.json(
        createAuthError(AuthErrorCode.SIGNUP_FAILED, 'Failed to create user account'),
        { status: 500 }
      );
    }

    // Note: Confirmation email is automatically sent when user is created with email_confirm: false
    // If email sending fails, user can use resend-confirmation endpoint

    // Create profile if it doesn't exist (trigger should handle this, but ensure it)
    try {
      await adminSupabase.from('profiles').insert({
        user_id: signUpData.user.id,
        name: full_name.trim(),
        college: college.trim(),
      }).select().single();
    } catch (profileError) {
      // Profile might already exist or will be created by trigger - that's okay
      console.log('Profile creation note:', profileError);
    }

    const response = {
      success: true,
      message: 'Account created successfully. Please check your email to confirm your account.',
      user: {
        id: signUpData.user.id,
        email: signUpData.user.email,
        email_confirmed: false,
      },
    };

    // Cache response for idempotency
    idempotencyStore.set(idempotencyKey, {
      response: { data: response, status: 201 },
      timestamp: Date.now(),
    });

    // Clean up old idempotency entries
    const now = Date.now();
    for (const [key, value] of idempotencyStore.entries()) {
      if (now - value.timestamp > 60000) {
        idempotencyStore.delete(key);
      }
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Signup endpoint error:', error);
    return NextResponse.json(
      createAuthError(
        AuthErrorCode.INTERNAL_ERROR,
        'An unexpected error occurred during signup'
      ),
      { status: 500 }
    );
  }
}

