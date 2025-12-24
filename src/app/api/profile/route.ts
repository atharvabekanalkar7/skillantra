import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { Profile } from '@/lib/types';
import { enforceEmailConfirmed } from '@/lib/api-helpers';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // CRITICAL: Enforce email confirmation (check from user object first, then admin as fallback)
  const emailCheck = await enforceEmailConfirmed(user, user.id);
  if (emailCheck) {
    return emailCheck;
  }

  // Try to select with phone_number first, fall back if column doesn't exist
  let profile: any = null;
  let error: any = null;
  
  // First try with phone_number
  const { data: profileWithPhone, error: errorWithPhone } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (errorWithPhone && errorWithPhone.message?.includes('phone_number')) {
    // phone_number column doesn't exist - select without it
    const { data: profileWithoutPhone, error: errorWithoutPhone } = await supabase
      .from('profiles')
      .select('id, user_id, name, bio, skills, college, user_type, created_at, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();
    
    profile = profileWithoutPhone;
    error = errorWithoutPhone;
    if (profile) {
      profile.phone_number = null; // Set to null if column doesn't exist
    }
  } else {
    profile = profileWithPhone;
    error = errorWithPhone;
  }

  if (error) {
    // Log the actual error for debugging
    console.error('Error fetching profile:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });

    // Only check for actual table not found errors - be very specific
    const errorMessage = error.message?.toLowerCase() || '';
    const isTableNotFound = 
      (error.code === '42P01') || // PostgreSQL relation does not exist
      (error.code === 'PGRST116') || // PostgREST table not found
      (errorMessage.includes('relation') && errorMessage.includes('profiles') && errorMessage.includes('does not exist')) ||
      (errorMessage.includes('table') && errorMessage.includes('profiles') && errorMessage.includes('does not exist'));
    
    if (isTableNotFound) {
      return NextResponse.json({ 
        profile: null,
        error: 'Database tables not initialized. Please run the migration SQL in Supabase: supabase-migration-complete.sql' 
      }, { status: 200 });
    }
    
    // For other errors, return null profile (user might not have one yet)
    // This is normal - user needs to create their profile
    return NextResponse.json({ profile: null }, { status: 200 });
  }

  // Add email from auth user to profile
  if (profile) {
    profile.email = user.email;
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // CRITICAL: Enforce email confirmation (check from user object first, then admin as fallback)
  const emailCheck = await enforceEmailConfirmed(user, user.id);
  if (emailCheck) {
    return emailCheck;
  }

  const body = await request.json();
  const { name, bio, skills, user_type, college, phone_number } = body;

  // Validate phone number if provided
  if (phone_number !== undefined) {
    if (phone_number !== null && phone_number !== '') {
      const cleaned = phone_number.trim();
      if (!/^[0-9]{10,15}$/.test(cleaned)) {
        return NextResponse.json({ 
          error: 'Phone number must be 10-15 digits and contain only numbers' 
        }, { status: 400 });
      }
    }
  }

  // Check if phone_number column exists by trying to select it
  let canUpdatePhone = false;
  const { error: testPhoneError } = await supabase
    .from('profiles')
    .select('phone_number')
    .limit(0);
  canUpdatePhone = !testPhoneError || !testPhoneError.message?.includes('phone_number');

  // Check if profile already exists
  const { data: existingProfile, error: profileCheckError } = await supabase
    .from('profiles')
    .select('id, college')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileCheckError) {
    // Log the actual error for debugging
    console.error('Error checking existing profile:', {
      message: profileCheckError.message,
      code: profileCheckError.code,
      details: profileCheckError.details,
      hint: profileCheckError.hint
    });

    // Only check for actual table not found errors - be very specific
    const errorMessage = profileCheckError.message?.toLowerCase() || '';
    const isTableNotFound = 
      (profileCheckError.code === '42P01') || // PostgreSQL relation does not exist
      (profileCheckError.code === 'PGRST116') || // PostgREST table not found
      (errorMessage.includes('relation') && errorMessage.includes('profiles') && errorMessage.includes('does not exist')) ||
      (errorMessage.includes('table') && errorMessage.includes('profiles') && errorMessage.includes('does not exist'));
    
    if (isTableNotFound) {
      return NextResponse.json({ 
        error: 'Database tables not initialized. Please run the migration SQL in Supabase: supabase-migration-complete.sql' 
      }, { status: 500 });
    }
    
    // For other errors (like RLS policy issues), return the actual error
    return NextResponse.json({ 
      error: profileCheckError.message || 'Database error. Check server logs for details.' 
    }, { status: 500 });
  }

  // Prevent college updates if profile already exists and has a college
  // Allow college to be set on initial profile creation
  if (existingProfile && existingProfile.college && college !== undefined && college !== existingProfile.college) {
    return NextResponse.json({ error: 'College cannot be updated after signup' }, { status: 400 });
  }

  // Check if this is a phone-only update (only phone_number provided, profile exists)
  const isPhoneOnlyUpdate = existingProfile && 
    phone_number !== undefined && 
    name === undefined && 
    bio === undefined && 
    skills === undefined && 
    user_type === undefined && 
    college === undefined;

  // If not a phone-only update, validate required fields
  if (!isPhoneOnlyUpdate) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!user_type || !['SkillSeeker', 'SkillHolder', 'Both'].includes(user_type)) {
      return NextResponse.json({ error: 'Valid user_type is required (SkillSeeker, SkillHolder, or Both)' }, { status: 400 });
    }
  }

  // Phone number is now required for all profiles (new and existing)
  // Check if phone_number is provided and valid
  if (phone_number === undefined || phone_number === null || phone_number === '') {
    return NextResponse.json({ 
      error: 'Phone number is required. Please enter your phone number with +91 prefix.' 
    }, { status: 400 });
  }

  // Validate phone number format
  const cleanedPhone = phone_number.trim();
  if (!/^[0-9]{10,15}$/.test(cleanedPhone)) {
    return NextResponse.json({ 
      error: 'Phone number must be 10-15 digits and contain only numbers (after +91 prefix)' 
    }, { status: 400 });
  }

  const updateData: Partial<Profile> = {
    updated_at: new Date().toISOString(),
  };

  // Only include fields that are being updated
  if (name !== undefined) {
    updateData.name = name.trim();
  }
  if (bio !== undefined) {
    updateData.bio = bio ? bio.trim() : null;
  }
  if (skills !== undefined) {
    updateData.skills = skills ? skills.trim() : null;
  }
  if (user_type !== undefined) {
    updateData.user_type = user_type as 'SkillSeeker' | 'SkillHolder' | 'Both';
  }

  // Allow college to be set on initial creation, but not updated if already set
  if (college !== undefined && (!existingProfile || !existingProfile.college)) {
    updateData.college = college ? college.trim() : null;
  }

  // Phone number is required - always include it in update
  if (canUpdatePhone) {
    (updateData as any).phone_number = cleanedPhone;
  } else {
    // Column doesn't exist - return helpful error message
    return NextResponse.json({ 
      error: 'phone_number column does not exist. Please run the migration: supabase-migration-phase-3-phone.sql' 
    }, { status: 400 });
  }


  let result;
  if (existingProfile) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    result = data;
  } else {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        ...updateData,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    result = data;
  }

  return NextResponse.json({ profile: result }, { status: existingProfile ? 200 : 201 });
}

export async function DELETE() {
  // Note: Delete account should NOT require email confirmation
  // Users should be able to delete their account regardless of confirmation status
  // This uses the same comprehensive deletion logic as /api/auth/delete-account
  try {
    const supabase = await createClient();
    let adminSupabase;
    
    try {
      adminSupabase = createServiceRoleClient();
    } catch (adminClientError: any) {
      // Extract error message safely
      const errorMessage = adminClientError?.message || 
                          String(adminClientError) || 
                          'Failed to initialize admin client. Please check your environment variables.';
      
      console.error('Error creating admin client for delete:', {
        message: errorMessage,
        errorType: typeof adminClientError,
        errorName: adminClientError?.name,
        hasMessage: !!adminClientError?.message,
        errorString: String(adminClientError),
      });
      
      // Return the actual error message to help with debugging
      // Make sure the response is properly formatted
      const errorResponse = { 
        error: errorMessage,
        code: 'ADMIN_CLIENT_INIT_FAILED',
        details: 'The service role key may be missing or invalid. Please check your .env.local file and restart the server.'
      };
      
      console.log('Returning error response:', errorResponse);
      
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Get current user - allow delete even if email not confirmed
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to delete your account' },
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
        { error: 'Failed to verify account status. Please try again.' },
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
        { error: deleteError.message || 'Failed to delete account. Please try again or contact support.' },
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
      { error: errorMessage },
      { status: 500 }
    );
  }
}

