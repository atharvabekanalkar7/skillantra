import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { Profile } from '@/lib/types';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's profile first
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    // PGRST116 is "not found" - that's okay, profile might not exist
    console.error('Error fetching profile for deletion:', profileError);
  }

  // Delete profile if it exists (this will cascade delete related data due to ON DELETE CASCADE)
  if (userProfile) {
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', user.id);

    if (deleteProfileError) {
      console.error('Error deleting profile:', deleteProfileError);
      return NextResponse.json({ 
        error: 'Failed to delete profile. Please try again.' 
      }, { status: 500 });
    }
  }

  // Delete the auth user account using service role client
  try {
    const { createServiceRoleClient } = await import('@/lib/supabase/server');
    const adminSupabase = createServiceRoleClient();
    
    const { error: deleteUserError } = await adminSupabase.auth.admin.deleteUser(user.id);
    
    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      // If admin deletion fails, sign out anyway
      await supabase.auth.signOut();
      return NextResponse.json({ 
        success: true,
        message: 'Profile deleted. Please contact support to fully delete your account.',
        signedOut: true
      });
    }
  } catch (err) {
    console.error('Error in account deletion:', err);
    // Sign out anyway
    await supabase.auth.signOut();
    return NextResponse.json({ 
      success: true,
      message: 'Profile deleted. Please contact support to fully delete your account.',
      signedOut: true
    });
  }

  // Sign out the user
  await supabase.auth.signOut();

  return NextResponse.json({ 
    success: true,
    message: 'Account deleted successfully.',
    signedOut: true
  });
}

