import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enforceEmailConfirmed } from '@/lib/api-helpers';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

  // Handle both Promise and direct params (for Next.js 15+ compatibility)
  const resolvedParams = 'then' in params ? await params : params;
  const applicationId = resolvedParams.id;

  if (!applicationId || typeof applicationId !== 'string') {
    return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
  }

  const body = await request.json();
  const { status } = body;

  if (!status || !['accepted', 'rejected'].includes(status)) {
    return NextResponse.json({ 
      error: 'Status is required and must be either "accepted" or "rejected"' 
    }, { status: 400 });
  }

  // First, get the task_id from the application
  const { data: application, error: applicationError } = await supabase
    .from('task_applications')
    .select('task_id')
    .eq('id', applicationId)
    .single();

  if (applicationError || !application) {
    console.error('Application lookup error:', applicationError);
    return NextResponse.json({ 
      error: 'Application not found',
      details: applicationError?.message 
    }, { status: 404 });
  }

  // Verify the user is the task creator by checking the task
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('creator_profile_id')
    .eq('id', application.task_id)
    .single();

  if (taskError || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.creator_profile_id !== userProfile.id) {
    return NextResponse.json({ 
      error: 'Only the task creator can update application status' 
    }, { status: 403 });
  }

  // Update the application status
  const { data: updatedApplication, error: updateError } = await supabase
    .from('task_applications')
    .update({ status })
    .eq('id', applicationId)
    .select()
    .single();

  if (updateError) {
    console.error('Application update error:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ application: updatedApplication }, { status: 200 });
}

