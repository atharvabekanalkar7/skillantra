/**
 * API helper functions for authentication and authorization
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { isEmailConfirmed } from '@/lib/auth-utils';
import { createAuthError, AuthErrorCode } from '@/lib/auth-errors';
import { NextResponse } from 'next/server';

/**
 * Check if user email is confirmed from the user object
 * Primary check: uses user object from session (most reliable)
 * Fallback: uses admin client if user object doesn't have confirmation status
 */
export async function enforceEmailConfirmed(
  user: any,
  userId: string
): Promise<NextResponse | null> {
  // PRIMARY CHECK: Use user object from session (most reliable and immediate)
  if (user && isEmailConfirmed(user)) {
    return null; // Email is confirmed, allow request to proceed
  }

  // If user object doesn't show confirmed, check with admin client as fallback
  // This handles edge cases where session might not be fully updated
  try {
    const adminSupabase = createServiceRoleClient();
    const { data, error } = await adminSupabase.auth.admin.getUserById(userId);

    if (error || !data?.user) {
      // If admin check fails, trust the user object from session
      // If user object says not confirmed, block access
      if (user && !isEmailConfirmed(user)) {
        return NextResponse.json(
          createAuthError(
            AuthErrorCode.EMAIL_NOT_CONFIRMED,
            'Please verify email before signing in'
          ),
          { status: 403 }
        );
      }
      // If we can't verify either way, allow (defensive - better UX)
      return null;
    }

    // Admin client check
    if (isEmailConfirmed(data.user)) {
      return null; // Email is confirmed
    }
  } catch (adminError: any) {
    // If admin client fails due to connection error, trust the user object
    const msg = (adminError?.message || '').toLowerCase();
    const causeCode = adminError?.cause?.code || '';
    const isConnError = (
      msg.includes('fetch failed') || msg.includes('connect timeout') ||
      causeCode === 'UND_ERR_CONNECT_TIMEOUT' || causeCode === 'ECONNREFUSED' ||
      adminError?.name === 'AuthRetryableFetchError'
    );

    if (isConnError) {
      console.warn('enforceEmailConfirmed: Supabase unreachable, trusting session data');
    } else {
      console.error('Error checking email confirmation with admin client:', adminError?.message);
    }

    if (user && !isEmailConfirmed(user)) {
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.EMAIL_NOT_CONFIRMED,
          'Please verify email before signing in'
        ),
        { status: 403 }
      );
    }
    // If session says confirmed or we can't verify, allow (defensive)
    return null;
  }

  // Email not confirmed
  return NextResponse.json(
    createAuthError(
      AuthErrorCode.EMAIL_NOT_CONFIRMED,
      'Please verify email before signing in'
    ),
    { status: 403 }
  );
}

