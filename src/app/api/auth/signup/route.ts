import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAuthError, AuthErrorCode } from "@/lib/auth-errors";
import { isValidEmail, isValidPassword } from "@/lib/auth-utils";

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
    const supabase: Awaited<ReturnType<typeof createClient>> = await createClient();

    // Get the site URL for email redirect
    // Use the request origin as fallback for production
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    (typeof request.headers.get('origin') === 'string' ? request.headers.get('origin') : 'http://localhost:3000');
    const emailRedirectTo = `${siteUrl}/auth/callback`;

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
    console.error("Signup error:", err);

    return NextResponse.json(
      createAuthError(
        AuthErrorCode.INTERNAL_ERROR,
        "Unexpected signup error"
      ),
      { status: 500 }
    );
  }
}
