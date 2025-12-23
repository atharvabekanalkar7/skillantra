import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enforceEmailConfirmed } from '@/lib/api-helpers';

export async function GET(
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

  // Handle params - can be a Promise in Next.js 15+ or object in earlier versions
  const resolvedParams = params instanceof Promise ? await params : params;
  const taskId = resolvedParams.id;

  if (!taskId) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
  }

  // Get task with creator profile information (including phone number)
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select(`
      *,
      creator:profiles!tasks_creator_profile_id_fkey(id, name, phone_number)
    `)
    .eq('id', taskId)
    .single();

  if (taskError) {
    const isTableNotFound = 
      taskError.message?.includes('schema cache') || 
      taskError.message?.includes('does not exist') ||
      taskError.code === '42P01';
    
    if (isTableNotFound) {
      return NextResponse.json({ 
        error: 'Tasks table not found. Please run the migration SQL in Supabase.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json({ task });
}

export async function DELETE(
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

  // Handle params - can be a Promise in Next.js 15+ or object in earlier versions
  const resolvedParams = params instanceof Promise ? await params : params;
  const taskId = resolvedParams.id;

  if (!taskId) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
  }

  // Verify task exists and belongs to user
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('creator_profile_id')
    .eq('id', taskId)
    .single();

  if (taskError) {
    console.error('Error fetching task for deletion:', taskError);
    if (taskError.code === 'PGRST116' || taskError.message?.includes('No rows')) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({ error: taskError.message || 'Failed to fetch task' }, { status: 500 });
  }

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.creator_profile_id !== userProfile.id) {
    return NextResponse.json({ error: 'Unauthorized to delete this task' }, { status: 403 });
  }

  // Delete the task
  const { error: deleteError } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
