import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enforceEmailConfirmed } from '@/lib/api-helpers';

export async function GET(request: Request) {
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

  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !userProfile) {
    return NextResponse.json({ error: 'Profile not found. Please create your profile first.' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const mine = searchParams.get('mine') === 'true';

  let query;

  if (mine) {
    // Return tasks created by the current user
    query = supabase
      .from('tasks')
      .select('*')
      .eq('creator_profile_id', userProfile.id)
      .order('created_at', { ascending: false });
  } else {
    // Return open tasks not created by the current user
    query = supabase
      .from('tasks')
      .select('*')
      .eq('status', 'open')
      .neq('creator_profile_id', userProfile.id)
      .order('created_at', { ascending: false });
  }

  const { data: tasks, error } = await query;

  if (error) {
    // Handle table not found gracefully
    const isTableNotFound = 
      error.message?.includes('schema cache') || 
      error.message?.includes('does not exist') ||
      error.code === '42P01';
    
    if (isTableNotFound) {
      return NextResponse.json({ 
        tasks: [],
        error: 'Tasks table not found. Please run the migration SQL in Supabase.' 
      }, { status: 200 });
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: tasks || [] });
}

export async function POST(request: Request) {
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

  // Get profile with phone_number, handle missing column gracefully
  let userProfile: any = null;
  let profileError: any = null;
  let phoneNumber: string | null = null;
  
  const { data: profileWithPhone, error: errorWithPhone } = await supabase
    .from('profiles')
    .select('id, phone_number')
    .eq('user_id', user.id)
    .single();
  
  if (errorWithPhone) {
    // Only fall back if the error is specifically about missing column
    // Other errors (like no rows found) should be handled differently
    const isColumnError = errorWithPhone.message?.includes('phone_number') || 
                         errorWithPhone.message?.includes('column') ||
                         errorWithPhone.code === '42703'; // PostgreSQL undefined column
    
    if (isColumnError) {
      // Try to get profile without phone_number if column doesn't exist
      const { data: profileBasic, error: errorBasic } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (errorBasic) {
        userProfile = null;
        profileError = errorBasic;
      } else {
        userProfile = profileBasic;
        profileError = null;
        phoneNumber = null;
      }
    } else {
      // For other errors (like profile not found), return the error
      userProfile = null;
      profileError = errorWithPhone;
      phoneNumber = null;
    }
  } else {
    userProfile = profileWithPhone;
    profileError = null;
    phoneNumber = profileWithPhone?.phone_number || null;
  }

  if (profileError || !userProfile) {
    return NextResponse.json({ error: 'Profile not found. Please create your profile first.' }, { status: 404 });
  }

  // Check if phone number is required and present
  if (!phoneNumber) {
    return NextResponse.json({ 
      error: 'Phone number is required to create tasks. Please add your phone number in your profile settings.',
      code: 'PHONE_NUMBER_REQUIRED'
    }, { status: 400 });
  }

  // Validate phone number format (10-15 digits, numeric only)
  const cleanedPhone = phoneNumber.trim();
  if (!/^[0-9]{10,15}$/.test(cleanedPhone)) {
    return NextResponse.json({ 
      error: 'Phone number must be 10-15 digits and contain only numbers. Please update your phone number in your profile settings.',
      code: 'PHONE_NUMBER_REQUIRED'
    }, { status: 400 });
  }

  const body = await request.json();
  const { title, description, skills_required, stipend_min, stipend_max } = body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  // Validate stipend values if provided
  if (stipend_min !== undefined && (typeof stipend_min !== 'number' || stipend_min < 0)) {
    return NextResponse.json({ error: 'stipend_min must be a non-negative number' }, { status: 400 });
  }

  if (stipend_max !== undefined && (typeof stipend_max !== 'number' || stipend_max < 0)) {
    return NextResponse.json({ error: 'stipend_max must be a non-negative number' }, { status: 400 });
  }

  if (stipend_min !== undefined && stipend_max !== undefined && stipend_min > stipend_max) {
    return NextResponse.json({ error: 'stipend_min cannot be greater than stipend_max' }, { status: 400 });
  }

  const taskData: {
    creator_profile_id: string;
    title: string;
    description?: string | null;
    skills_required?: string | null;
    stipend_min?: number | null;
    stipend_max?: number | null;
    status: 'open' | 'closed';
  } = {
    creator_profile_id: userProfile.id,
    title: title.trim(),
    description: description ? description.trim() : null,
    skills_required: skills_required ? skills_required.trim() : null,
    stipend_min: stipend_min !== undefined ? stipend_min : null,
    stipend_max: stipend_max !== undefined ? stipend_max : null,
    status: 'open', // Always create as 'open'
  };

  const { data: newTask, error: insertError } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single();

  if (insertError) {
    // Handle table not found gracefully
    const isTableNotFound = 
      insertError.message?.includes('schema cache') || 
      insertError.message?.includes('does not exist') ||
      insertError.code === '42P01';
    
    if (isTableNotFound) {
      return NextResponse.json({ 
        error: 'Tasks table not found. Please run the migration SQL in Supabase.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ task: newTask }, { status: 201 });
}

