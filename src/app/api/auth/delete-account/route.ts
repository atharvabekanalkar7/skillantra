export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { createAuthError, AuthErrorCode } from '@/lib/auth-errors';

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    let adminSupabase;
    
    try {
      adminSupabase = createServiceRoleClient();
    } catch (adminClientError: any) {
      console.error('Error creating admin client for delete:', {
        message: adminClientError?.message,
        stack: adminClientError?.stack,
        name: adminClientError?.name,
        error: adminClientError,
      });
      
      // Return user-friendly message directing them to contact support
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.INTERNAL_ERROR,
          "Delete account functionality isn't working properly. Please contact us at skillantra0511@gmail.com to delete all your information from our database."
        ),
        { status: 500 }
      );
    }

    // Get current user - allow delete even if email not confirmed
    // Users should be able to delete their account regardless of confirmation status
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

    const userId = user.id;

    // Verify user is not already deleted
    let userData;
    try {
      const { data, error: getUserError } = await adminSupabase.auth.admin.getUserById(userId);
      if (getUserError) {
        console.error('Error getting user data:', getUserError);
        // If user not found, they might already be deleted - sign out and return success
        await supabase.auth.signOut();
        return NextResponse.json({
          success: true,
          message: 'Account already deleted',
        });
      }
      userData = data;
    } catch (getUserError: any) {
      console.error('Exception getting user data:', getUserError);
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.INTERNAL_ERROR,
          'Failed to verify account status. Please try again.'
        ),
        { status: 500 }
      );
    }

    if (!userData?.user || userData.user.deleted_at) {
      // User already deleted - sign out and return success
      await supabase.auth.signOut();
      return NextResponse.json({
        success: true,
        message: 'Account already deleted',
      });
    }

    // CRITICAL: Get profile ID first, then delete all related data
    // This ensures complete cleanup even if cascade fails
    let profileId: string | null = null;
    try {
      const { data: profileData, error: profileFetchError } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profileData?.id) {
        profileId = profileData.id;
      }
      
      if (profileFetchError && !profileFetchError.message?.includes('does not exist')) {
        console.error('Error fetching profile for deletion:', profileFetchError);
      }
    } catch (profileFetchError: any) {
      console.error('Exception fetching profile for deletion:', profileFetchError);
    }

    // If profile exists, delete all related data
    if (profileId) {
      // 1. Delete task applications where user is applicant
      try {
        const { error: applicationsError } = await adminSupabase
          .from('task_applications')
          .delete()
          .eq('applicant_profile_id', profileId);
        if (applicationsError && !applicationsError.message?.includes('does not exist')) {
          console.error('Error deleting task applications:', applicationsError);
        }
      } catch (applicationsError: any) {
        console.error('Exception deleting task applications:', applicationsError);
      }

      // 2. Delete tasks created by user
      try {
        const { error: tasksError } = await adminSupabase
          .from('tasks')
          .delete()
          .eq('creator_profile_id', profileId);
        if (tasksError && !tasksError.message?.includes('does not exist')) {
          console.error('Error deleting tasks:', tasksError);
        }
      } catch (tasksError: any) {
        console.error('Exception deleting tasks:', tasksError);
      }

      // 3. Delete collaboration requests (both sent and received)
      try {
        const { error: requestsError } = await adminSupabase
          .from('collaboration_requests')
          .delete()
          .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`);
        if (requestsError && !requestsError.message?.includes('does not exist')) {
          console.error('Error deleting collaboration requests:', requestsError);
        }
      } catch (requestsError: any) {
        console.error('Exception deleting collaboration requests:', requestsError);
      }

      // 4. Delete profile (should cascade from auth.users, but ensure it)
      try {
        const { error: profileError } = await adminSupabase
          .from('profiles')
          .delete()
          .eq('user_id', userId);
        if (profileError && !profileError.message?.includes('does not exist')) {
          console.error('Error deleting profile:', profileError);
        }
      } catch (profileError: any) {
        console.error('Exception deleting profile:', profileError);
      }
    }

    // 5. CRITICAL: Hard delete auth user using admin client
    // This permanently removes the user from auth.users, freeing the email
    // This will cascade delete profiles and related data via triggers
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting auth user:', {
        message: deleteError.message,
        status: deleteError.status,
        name: deleteError.name,
        error: deleteError,
      });
      return NextResponse.json(
        createAuthError(
          AuthErrorCode.DELETE_FAILED,
          deleteError.message || 'Failed to delete account. Please try again or contact support.'
        ),
        { status: 500 }
      );
    }

    // Sign out the user (session will be invalid anyway)
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      // Ignore sign out errors - user is already deleted
      console.log('Sign out after deletion (expected):', signOutError);
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully. You can now sign up again with the same email.',
    });
  } catch (error: any) {
    console.error('Delete account endpoint error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      error: error,
    });
    
    // Provide more specific error messages
    let errorMessage = 'An unexpected error occurred during account deletion';
    if (error?.message) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else {
        errorMessage = `Failed to delete account: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      createAuthError(
        AuthErrorCode.INTERNAL_ERROR,
        errorMessage
      ),
      { status: 500 }
    );
  }
}

