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

  // Task expiry logic: hide tasks older than 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  if (mine) {
    // Return tasks created by the current user
    query = supabase
      .from('tasks')
      .select(`
        *,
        creator:profiles!tasks_creator_profile_id_fkey(id, name, college, user_type)
      `)
      .eq('creator_profile_id', userProfile.id)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false });
  } else {
    // Return open tasks not created by the current user
    query = supabase
      .from('tasks')
      .select(`
        *,
        creator:profiles!tasks_creator_profile_id_fkey(id, name, college, user_type)
      `)
      .eq('status', 'open')
      .neq('creator_profile_id', userProfile.id)
      .gte('created_at', sevenDaysAgo)
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

// URL validation helper
function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
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
    const isColumnError = errorWithPhone.message?.includes('phone_number') ||
      errorWithPhone.message?.includes('column') ||
      errorWithPhone.code === '42703'; // PostgreSQL undefined column

    if (isColumnError) {
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
  const {
    title,
    description,
    skills_required,
    payment_type,
    stipend_min,
    stipend_max,
    payment_other_details,
    application_deadline,
    mode_of_work,
    attachments,
  } = body;

  // ---- Title validation ----
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  // ---- Payment validation ----
  if (payment_type && !['stipend', 'other'].includes(payment_type)) {
    return NextResponse.json({ error: 'Payment type must be "stipend" or "other"' }, { status: 400 });
  }

  if (payment_type === 'stipend') {
    if (stipend_min === undefined || stipend_min === null || typeof stipend_min !== 'number' || stipend_min < 0) {
      return NextResponse.json({ error: 'Minimum stipend is required and must be a non-negative number' }, { status: 400 });
    }
    if (stipend_max === undefined || stipend_max === null || typeof stipend_max !== 'number' || stipend_max < 0) {
      return NextResponse.json({ error: 'Maximum stipend is required and must be a non-negative number' }, { status: 400 });
    }
    if (stipend_min > stipend_max) {
      return NextResponse.json({ error: 'Minimum stipend cannot be greater than maximum stipend' }, { status: 400 });
    }
  }

  if (payment_type === 'other') {
    if (!payment_other_details || typeof payment_other_details !== 'string' || payment_other_details.trim().length === 0) {
      return NextResponse.json({ error: 'Payment details are required when payment type is "Other"' }, { status: 400 });
    }
    // Ensure stipend fields are not sent with 'other' type
    if (stipend_min !== undefined && stipend_min !== null) {
      return NextResponse.json({ error: 'Stipend values should not be provided when payment type is "Other"' }, { status: 400 });
    }
    if (stipend_max !== undefined && stipend_max !== null) {
      return NextResponse.json({ error: 'Stipend values should not be provided when payment type is "Other"' }, { status: 400 });
    }
  }

  // ---- Deadline validation ----
  if (application_deadline) {
    const deadlineDate = new Date(application_deadline);
    if (isNaN(deadlineDate.getTime())) {
      return NextResponse.json({ error: 'Invalid deadline format' }, { status: 400 });
    }
    if (deadlineDate.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Application deadline must be in the future' }, { status: 400 });
    }
  }

  // ---- Mode of work validation ----
  if (mode_of_work && !['remote', 'hybrid', 'in-person'].includes(mode_of_work)) {
    return NextResponse.json({ error: 'Mode of work must be "remote", "hybrid", or "in-person"' }, { status: 400 });
  }

  // ---- Attachments validation ----
  let validatedAttachments: { category: string; link: string }[] = [];
  if (attachments !== undefined && attachments !== null) {
    if (!Array.isArray(attachments)) {
      return NextResponse.json({ error: 'Attachments must be an array' }, { status: 400 });
    }
    const validCategories = ['GitHub', 'Figma', 'Notion', 'Google Drive', 'Other'];
    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i];
      if (!att || typeof att !== 'object') {
        return NextResponse.json({ error: `Attachment ${i + 1} is invalid` }, { status: 400 });
      }
      if (!att.category || !validCategories.includes(att.category)) {
        return NextResponse.json({ error: `Attachment ${i + 1} has an invalid category. Must be one of: ${validCategories.join(', ')}` }, { status: 400 });
      }
      if (!att.link || typeof att.link !== 'string' || att.link.trim().length === 0) {
        return NextResponse.json({ error: `Attachment ${i + 1} is missing a link` }, { status: 400 });
      }
      if (!isValidUrl(att.link.trim())) {
        return NextResponse.json({ error: `Attachment ${i + 1} has an invalid URL. Must start with http:// or https://` }, { status: 400 });
      }
      validatedAttachments.push({
        category: att.category,
        link: att.link.trim(),
      });
    }
  }

  // ---- Build task data ----
  const taskData: Record<string, any> = {
    creator_profile_id: userProfile.id,
    title: title.trim(),
    description: description ? description.trim() : null,
    skills_required: skills_required ? skills_required.trim() : null,
    payment_type: payment_type || null,
    stipend_min: payment_type === 'stipend' ? stipend_min : null,
    stipend_max: payment_type === 'stipend' ? stipend_max : null,
    payment_other_details: payment_type === 'other' ? payment_other_details.trim() : null,
    application_deadline: application_deadline || null,
    mode_of_work: mode_of_work || null,
    attachments: validatedAttachments,
    status: 'open',
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
