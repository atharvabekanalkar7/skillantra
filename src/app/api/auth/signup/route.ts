import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAuthError, AuthErrorCode } from "@/lib/auth-errors";
import { isValidEmail, isValidPassword, isValidIITMandiEmail, getRedirectUrl } from "@/lib/auth-utils";

function isConnectionError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const cause = error.cause;
  const causeCode = cause?.code || '';
  return (
    msg.includes('fetch failed') || msg.includes('connect timeout') ||
    msg.includes('econnrefused') || msg.includes('enotfound') ||
    msg.includes('etimedout') || msg.includes('authretryablefetcherror') ||
    causeCode === 'UND_ERR_CONNECT_TIMEOUT' || causeCode === 'ECONNREFUSED' ||
    causeCode === 'ENOTFOUND' || error.name === 'AuthRetryableFetchError'
  );
}

export async function POST(request: Request) {
  try {
    // 1️⃣ Parse body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.MISSING_FIELDS,
          "Invalid request body"
        ),
        { status: 400 }
      );
    }

    const { email, password, full_name, college } = body;

    // 2️⃣ Basic validation
    if (!email || !password || !full_name || !college) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.MISSING_FIELDS,
          "Email, password, full name and college are required"
        ),
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.INVALID_EMAIL,
          "Invalid email format"
        ),
        { status: 400 }
      );
    }

    // Validate IIT Mandi email domain
    if (!isValidIITMandiEmail(email)) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.INVALID_EMAIL,
          "Only @students.iitmandi.ac.in and @iitmandi.ac.in email addresses are allowed to verify that student is actually from IIT Mandi."
        ),
        { status: 400 }
      );
    }

    const passwordCheck = isValidPassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.WEAK_PASSWORD,
          passwordCheck.error || "Weak password"
        ),
        { status: 400 }
      );
    }

    // 3️⃣ Supabase signup
    let supabase: Awaited<ReturnType<typeof createClient>>;
    try {
      supabase = await createClient();
    } catch (clientErr: any) {
      console.error('Signup: Failed to create Supabase client:', clientErr.message);
      if (isConnectionError(clientErr)) {
        return NextResponse.json(
          createAuthError(AuthErrorCode.INTERNAL_ERROR, 'Unable to reach the authentication server. It may be temporarily unavailable. Please try again in a few minutes.'),
          { status: 503 }
        );
      }
      throw clientErr;
    }

    // 🔴 DYNAMIC REDIRECT URL
    // Use the securely generated centralized redirect dependent purely on APP_MODE
    const emailRedirectTo = getRedirectUrl();

    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: full_name.trim(),
          college: college.trim(),
        },
      },
    });

    // 4️⃣ Hard failure
    if (error) {
      // Check for connection errors first
      if (isConnectionError(error)) {
        console.error('Signup: Supabase connection error during signUp:', error.message);
        return NextResponse.json(
          createAuthError(AuthErrorCode.INTERNAL_ERROR, 'Unable to reach the authentication server. It may be temporarily unavailable. Please try again in a few minutes.'),
          { status: 503 }
        );
      }

      // Provide more helpful error messages for common issues
      let errorMessage = error.message;

      // Check for redirect URL errors
      if (error.message?.includes('redirect') || error.message?.includes('redirect_to') || error.message?.includes('redirect URL')) {
        errorMessage = 'Email confirmation redirect URL is not configured. Please contact support at skillantra0511@gmail.com.';
      } else if (error.message?.includes('email') && error.message?.includes('send')) {
        errorMessage = 'Unable to send confirmation email. Please check your email address and try again, or contact support at skillantra0511@gmail.com.';
      }

      return NextResponse.json(
        createAuthError(
          AuthErrorCode.SIGNUP_FAILED,
          errorMessage
        ),
        { status: 400 }
      );
    }

    /**
     * 5️⃣ 🔴 DUPLICATE EMAIL DETECTION (CORRECT WAY)
     *
     * Supabase behavior:
     * - Existing email (confirmed OR unconfirmed):
     *   user exists, session is null, identities = []
     */
    if (
      data?.user &&
      !data?.session &&
      Array.isArray(data.user.identities) &&
      data.user.identities.length === 0
    ) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.EMAIL_ALREADY_EXISTS,
          "Email address already in use"
        ),
        { status: 409 }
      );
    }

    // 6️⃣ Success (new user)
    return NextResponse.json(
      {
        success: true,
        message: "Signup successful. Please verify your email.",
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Signup error:', err?.message, err?.cause?.code);

    if (isConnectionError(err)) {
      return NextResponse.json(
        createAuthError(AuthErrorCode.INTERNAL_ERROR, 'Unable to reach the authentication server. It may be temporarily unavailable. Please try again in a few minutes.'),
        { status: 503 }
      );
    }

    return NextResponse.json(
      createAuthError(
        AuthErrorCode.INTERNAL_ERROR,
        "Unexpected signup error"
      ),
      { status: 500 }
    );
  }
}
