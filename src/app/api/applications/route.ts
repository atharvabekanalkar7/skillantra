import { createClient } from '@/lib/supabase/server';
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
  const sent = searchParams.get('sent') === 'true';
  const received = searchParams.get('received') === 'true';

  let query;

  if (sent) {
    // Return applications made by the user (sent applications)
    // Include task creator's phone number only if application is accepted
    query = supabase
      .from('task_applications')
      .select(`
        *,
        task:tasks(
          *,
          creator:profiles!tasks_creator_profile_id_fkey(id, name, phone_number)
        )
      `)
      .eq('applicant_profile_id', userProfile.id)
      .order('created_at', { ascending: false });
  } else if (received) {
    // Return applications received on the user's tasks
    const { data: userTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .eq('creator_profile_id', userProfile.id);

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 500 });
    }

    const taskIds = userTasks?.map(t => t.id) || [];

    if (taskIds.length === 0) {
      return NextResponse.json({ applications: [] });
    }

    query = supabase
      .from('task_applications')
      .select(`
        *,
        task:tasks(*),
        applicant:profiles!task_applications_applicant_profile_id_fkey(id, name, phone_number)
      `)
      .in('task_id', taskIds)
      .order('created_at', { ascending: false });
  } else {
    // If neither sent nor received is specified, return empty array
    // Client must specify one of the query parameters
    return NextResponse.json({ applications: [] });
  }

  const { data: applications, error } = await query;

  if (error) {
    // Handle table not found gracefully
    const isTableNotFound = 
      error.message?.includes('schema cache') || 
      error.message?.includes('does not exist') ||
      error.code === '42P01';
    
    if (isTableNotFound) {
      return NextResponse.json({ 
        applications: [],
        error: 'Applications table not found. Please run the migration SQL in Supabase.' 
      }, { status: 200 });
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter contact information: only show if application status is 'accepted'
  const filteredApplications = (applications || []).map((app: any) => {
    const filtered = { ...app };
    
    if (sent) {
      // For sent applications: hide creator's contact info unless accepted
      if (filtered.task?.creator) {
        if (filtered.status !== 'accepted') {
          filtered.task.creator.phone_number = null;
        }
      }
    } else if (received) {
      // For received applications: hide applicant's contact info unless accepted
      if (filtered.applicant) {
        if (filtered.status !== 'accepted') {
          filtered.applicant.phone_number = null;
        }
      }
    }
    
    return filtered;
  });

  return NextResponse.json({ applications: filteredApplications });
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
      error: 'Phone number is required to apply to tasks. Please add your phone number in your profile settings.',
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
  const { task_id } = body;

  if (!task_id || typeof task_id !== 'string') {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
  }

  // Verify task exists and is open
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, creator_profile_id, status')
    .eq('id', task_id)
    .single();

  if (taskError || !task) {
    // Handle table not found gracefully
    const isTableNotFound = 
      taskError?.message?.includes('schema cache') || 
      taskError?.message?.includes('does not exist') ||
      taskError?.code === '42P01';
    
    if (isTableNotFound) {
      return NextResponse.json({ 
        error: 'Tasks table not found. Please run the migration SQL in Supabase.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.status !== 'open') {
    return NextResponse.json({ error: 'Task is not open for applications' }, { status: 400 });
  }

  // Prevent applying to own task
  if (task.creator_profile_id === userProfile.id) {
    return NextResponse.json({ error: 'Cannot apply to your own task' }, { status: 400 });
  }

  // Check if application already exists
  const { data: existingApplication } = await supabase
    .from('task_applications')
    .select('id')
    .eq('task_id', task_id)
    .eq('applicant_profile_id', userProfile.id)
    .single();

  if (existingApplication) {
    return NextResponse.json({ error: 'You have already applied to this task' }, { status: 400 });
  }

  // Create application
  const { data: newApplication, error: insertError } = await supabase
    .from('task_applications')
    .insert({
      task_id,
      applicant_profile_id: userProfile.id,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ application: newApplication }, { status: 201 });
}

