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

  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !userProfile) {
    return NextResponse.json({ error: 'Profile not found. Please create your profile first.' }, { status: 404 });
  }

  const body = await request.json();
  const { title, description, skills_required, status } = body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const taskData: {
    creator_profile_id: string;
    title: string;
    description?: string | null;
    skills_required?: string | null;
    status?: 'open' | 'closed';
  } = {
    creator_profile_id: userProfile.id,
    title: title.trim(),
    description: description ? description.trim() : null,
    skills_required: skills_required ? skills_required.trim() : null,
    status: status === 'closed' ? 'closed' : 'open',
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

