import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    // Return applications made by the user
    query = supabase
      .from('task_applications')
      .select(`
        *,
        task:tasks(*)
      `)
      .eq('applicant_profile_id', userProfile.id)
      .order('created_at', { ascending: false });
  } else {
    // Return applications for tasks created by the user
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
        applicant:profiles!task_applications_applicant_profile_id_fkey(*)
      `)
      .in('task_id', taskIds)
      .order('created_at', { ascending: false });
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

  return NextResponse.json({ applications: applications || [] });
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

  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !userProfile) {
    return NextResponse.json({ error: 'Profile not found. Please create your profile first.' }, { status: 404 });
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

