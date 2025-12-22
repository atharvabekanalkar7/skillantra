import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createAuthError, AuthErrorCode } from '@/lib/auth-errors';

export async function POST() {
  try {
    const supabase = await createClient();

    // Sign out from Supabase (clears session)
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      // Even if signOut fails, return success (session might already be cleared)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    console.error('Logout endpoint error:', error);
    return NextResponse.json(
      createAuthError(
        AuthErrorCode.INTERNAL_ERROR,
        'An unexpected error occurred during logout'
      ),
      { status: 500 }
    );
  }
}

