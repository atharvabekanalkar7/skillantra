import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { createAuthError, AuthErrorCode } from '@/lib/auth-errors';

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createServiceRoleClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        createAuthError(AuthErrorCode.UNAUTHORIZED, 'You must be logged in to delete your account'),
        { status: 401 }
      );
    }

    // Verify user is not already deleted
    const { data: userData } = await adminSupabase.auth.admin.getUserById(user.id);
    if (!userData?.user || userData.user.deleted_at) {
      // User already deleted - sign out and return success
      await supabase.auth.signOut();
      return NextResponse.json({
        success: true,
        message: 'Account already deleted',
      });
    }

    // CRITICAL: Hard delete using admin client
    // This permanently removes the user from auth.users, freeing the email
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.DELETE_FAILED,
          deleteError.message || 'Failed to delete account'
        ),
        { status: 500 }
      );
    }

    // Profile should be cascade deleted by trigger, but ensure it
    try {
      await adminSupabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);
    } catch (profileError) {
      // Profile might already be deleted by trigger - that's okay
      console.log('Profile deletion note:', profileError);
    }

    // Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully. You can now sign up again with the same email.',
    });
  } catch (error: any) {
    console.error('Delete account endpoint error:', error);
    return NextResponse.json(
      createAuthError(
        AuthErrorCode.INTERNAL_ERROR,
        'An unexpected error occurred during account deletion'
      ),
      { status: 500 }
    );
  }
}

