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
    // Primary check: use user object from session (most reliable)
    if (!isEmailConfirmed(user)) {
      // Double-check with admin client as fallback (in case session is stale)
      try {
        const { data: userData } = await adminSupabase.auth.admin.getUserById(user.id);
        if (userData?.user && isEmailConfirmed(userData.user)) {
          // Admin says confirmed, but session says not - session might be stale
          // Return user as confirmed (admin is source of truth)
          return NextResponse.json({
            user: {
              id: user.id,
              email: user.email,
              email_confirmed: true,
            },
          });
        }
      } catch (adminError) {
        console.error('Error checking email with admin client:', adminError);
      }
      
      // Email not confirmed - return user with email_confirmed: false
      // Client should redirect to login
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          email_confirmed: false,
        },
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

