import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
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

    // Get base URL for email redirect
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const emailRedirectUrl = `${baseUrl}/auth/callback?next=/login`;

    // Use regular client for signup (works without service role key)
    const supabase = await createClient();
    
    // Create user with regular client (Supabase handles duplicate email check)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: emailRedirectUrl,
        data: {
          full_name: full_name.trim(),
          college: college.trim(),
        },
      },
    });

    if (signUpError) {
      console.error('Signup error details:', {
        message: signUpError.message,
        status: signUpError.status,
        name: signUpError.name,
      });
      
      // Handle specific Supabase errors
      const errorMessage = signUpError.message?.toLowerCase() || '';
      if (
        errorMessage.includes('already registered') || 
        errorMessage.includes('already exists') ||
        errorMessage.includes('user already registered') ||
        errorMessage.includes('email address is already in use')
      ) {
        return NextResponse.json(
          createAuthError(
            AuthErrorCode.EMAIL_ALREADY_EXISTS,
            'An account with this email already exists. Please log in or use a different email.'
          ),
          { status: 409 }
        );
      }

      // Return the actual error message for debugging
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.SIGNUP_FAILED,
          signUpError.message || 'Failed to create account. Please try again.'
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
    // Only create profile if user has a session (email confirmation disabled) or use service role if available
    if (signUpData.session) {
      // Email confirmation is disabled - create profile immediately
      try {
        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: signUpData.user.id,
          name: full_name.trim(),
          college: college.trim(),
        });

        if (profileError) {
          // Check if it's a duplicate key error (profile already exists)
          if (profileError.code === '23505' || profileError.message?.includes('duplicate')) {
            // Profile already exists - that's fine, trigger might have created it
            console.log('Profile already exists (likely created by trigger)');
          } else {
            // Other error - log it but don't fail signup
            console.error('Profile creation error:', profileError);
          }
        }
      } catch (profileError: any) {
        // Profile might already exist or will be created by trigger - that's okay
        console.log('Profile creation note:', profileError?.message || profileError);
      }
    } else {
      // Email confirmation required - profile will be created by trigger when email is confirmed
      // Or we can try with service role if available
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const adminSupabase = createServiceRoleClient();
          const { error: profileError } = await adminSupabase.from('profiles').insert({
            user_id: signUpData.user.id,
            name: full_name.trim(),
            college: college.trim(),
          });
          if (profileError && profileError.code !== '23505') {
            console.log('Profile creation note (admin):', profileError.message);
          }
        } catch (profileError: any) {
          // That's okay - trigger will handle it
          console.log('Profile creation note:', profileError?.message || profileError);
        }
      }
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
    console.error('Signup endpoint error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause,
    });
    
    // Return more detailed error for debugging
    const errorMessage = error?.message || 'An unexpected error occurred during signup';
    return NextResponse.json(
      createAuthError(
        AuthErrorCode.INTERNAL_ERROR,
        errorMessage
      ),
      { status: 500 }
    );
  }
}

