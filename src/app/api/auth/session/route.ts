import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createAuthError, AuthErrorCode } from '@/lib/auth-errors';
import { isUserDeleted, isEmailConfirmed } from '@/lib/auth-utils';

export async function GET() {
  try {
    const supabase = await createClient();
    const adminSupabase = createServiceRoleClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // CRITICAL: Check if user is deleted
    const isDeleted = await isUserDeleted(user.id, adminSupabase);
    if (isDeleted) {
      // Clear session if user is deleted
      await supabase.auth.signOut();
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.ACCOUNT_DELETED,
          'This account has been deleted'
        ),
        { status: 401 }
      );
    }

    // CRITICAL: Check if email is confirmed
    if (!isEmailConfirmed(user)) {
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          email_confirmed: false,
        },
        requires_confirmation: true,
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        email_confirmed: true,
      },
    });
  } catch (error: any) {
    console.error('Session endpoint error:', error);
    return NextResponse.json(
      createAuthError(
        AuthErrorCode.INTERNAL_ERROR,
        'An unexpected error occurred'
      ),
      { status: 500 }
    );
  }
}

