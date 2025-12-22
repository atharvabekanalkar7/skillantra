import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { createAuthError, AuthErrorCode } from '@/lib/auth-errors';
import { isValidEmail, checkRateLimit, getClientIP, isEmailConfirmed } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.MISSING_FIELDS,
          'Email is required'
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

    // Rate limiting per email
    const emailKey = `resend:email:${email.toLowerCase()}`;
    const emailLimit = checkRateLimit(emailKey, { max: 5, windowMs: 60 * 60 * 1000 });
    if (!emailLimit.allowed) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.RESEND_RATE_LIMIT,
          `Too many resend attempts. Please try again after ${new Date(emailLimit.resetAt).toLocaleTimeString()}`
        ),
        { status: 429 }
      );
    }

    // Rate limiting per IP
    const clientIP = getClientIP(request);
    const ipKey = `resend:ip:${clientIP}`;
    const ipLimit = checkRateLimit(ipKey, { max: 20, windowMs: 60 * 60 * 1000 });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.RATE_LIMIT_EXCEEDED,
          'Too many resend attempts from this IP. Please try again later.'
        ),
        { status: 429 }
      );
    }

    // Check if user exists using Admin API
    const adminSupabase = createServiceRoleClient();
    const { data: usersData } = await adminSupabase.auth.admin.listUsers();
    const user = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase() && u.deleted_at === null
    );

    // If user does NOT exist → return error
    if (!user) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.EMAIL_NOT_CONFIRMED,
          'No account found with this email address.'
        ),
        { status: 404 }
      );
    }

    // If email_confirmed_at IS NOT NULL → return error
    if (isEmailConfirmed(user)) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.ALREADY_CONFIRMED,
          'This email has already been confirmed. Please log in.'
        ),
        { status: 400 }
      );
    }

    // Get base URL for email redirect
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const emailRedirectUrl = `${baseUrl}/auth/callback?next=/login`;

    // Use regular client for resend (resend works with regular client)
    const supabase = await createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: emailRedirectUrl,
      },
    });

    if (resendError) {
      console.error('Resend confirmation error:', resendError);
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.CONFIRMATION_FAILED,
          'Failed to resend confirmation email. Please try again.'
        ),
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent. Please check your inbox.',
    });
  } catch (error: any) {
    console.error('Resend confirmation endpoint error:', error);
    return NextResponse.json(
      createAuthError(
        AuthErrorCode.INTERNAL_ERROR,
        'An unexpected error occurred'
      ),
      { status: 500 }
    );
  }
}

