import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enforceEmailConfirmed } from '@/lib/api-helpers';

// URL validation helper
function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

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
      creator:profiles!tasks_creator_profile_id_fkey(id, name, college, user_type, bio, skills, created_at)
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

  // Check if task has expired (older than 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const taskDate = new Date(task.created_at);
  if (taskDate < sevenDaysAgo) {
    return NextResponse.json(
      { error: 'This task has expired and is no longer available.' },
      { status: 404 }
    );
  }

  return NextResponse.json({ task });
}

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

  const resolvedParams = params instanceof Promise ? await params : params;
  const taskId = resolvedParams.id;

  if (!taskId) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
  }

  // Verify task exists and belongs to user
  const { data: existingTask, error: taskError } = await supabase
    .from('tasks')
    .select('creator_profile_id')
    .eq('id', taskId)
    .single();

  if (taskError || !existingTask) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (existingTask.creator_profile_id !== userProfile.id) {
    return NextResponse.json({ error: 'Unauthorized to edit this task' }, { status: 403 });
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
    status,
  } = body;

  const updateData: Record<string, any> = {};

  // ---- Title ----
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    }
    updateData.title = title.trim();
  }

  // ---- Description ----
  if (description !== undefined) {
    updateData.description = description ? description.trim() : null;
  }

  // ---- Skills ----
  if (skills_required !== undefined) {
    updateData.skills_required = skills_required ? skills_required.trim() : null;
  }

  // ---- Status ----
  if (status !== undefined) {
    if (!['open', 'closed'].includes(status)) {
      return NextResponse.json({ error: 'Status must be "open" or "closed"' }, { status: 400 });
    }
    updateData.status = status;
  }

  // ---- Payment ----
  if (payment_type !== undefined) {
    if (payment_type !== null && !['stipend', 'other'].includes(payment_type)) {
      return NextResponse.json({ error: 'Payment type must be "stipend" or "other"' }, { status: 400 });
    }
    updateData.payment_type = payment_type;

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
      updateData.stipend_min = stipend_min;
      updateData.stipend_max = stipend_max;
      updateData.payment_other_details = null;
    } else if (payment_type === 'other') {
      if (!payment_other_details || typeof payment_other_details !== 'string' || payment_other_details.trim().length === 0) {
        return NextResponse.json({ error: 'Payment details are required when payment type is "Other"' }, { status: 400 });
      }
      updateData.payment_other_details = payment_other_details.trim();
      updateData.stipend_min = null;
      updateData.stipend_max = null;
    } else {
      // payment_type is null — clear all payment fields
      updateData.stipend_min = null;
      updateData.stipend_max = null;
      updateData.payment_other_details = null;
    }
  }

  // ---- Deadline ----
  if (application_deadline !== undefined) {
    if (application_deadline !== null) {
      const deadlineDate = new Date(application_deadline);
      if (isNaN(deadlineDate.getTime())) {
        return NextResponse.json({ error: 'Invalid deadline format' }, { status: 400 });
      }
      // For edits, allow deadline in the past only if there's an explanation
      // but still warn — typically it should be in the future
      if (deadlineDate.getTime() <= Date.now()) {
        return NextResponse.json({ error: 'Application deadline must be in the future' }, { status: 400 });
      }
    }
    updateData.application_deadline = application_deadline;
  }

  // ---- Mode of work ----
  if (mode_of_work !== undefined) {
    if (mode_of_work !== null && !['remote', 'hybrid', 'in-person'].includes(mode_of_work)) {
      return NextResponse.json({ error: 'Mode of work must be "remote", "hybrid", or "in-person"' }, { status: 400 });
    }
    updateData.mode_of_work = mode_of_work;
  }

  // ---- Attachments ----
  if (attachments !== undefined) {
    if (attachments === null) {
      updateData.attachments = [];
    } else {
      if (!Array.isArray(attachments)) {
        return NextResponse.json({ error: 'Attachments must be an array' }, { status: 400 });
      }
      const validCategories = ['GitHub', 'Figma', 'Notion', 'Google Drive', 'Other'];
      const validatedAttachments: { category: string; link: string }[] = [];

      for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i];
        if (!att || typeof att !== 'object') {
          return NextResponse.json({ error: `Attachment ${i + 1} is invalid` }, { status: 400 });
        }
        if (!att.category || !validCategories.includes(att.category)) {
          return NextResponse.json({ error: `Attachment ${i + 1} has an invalid category` }, { status: 400 });
        }
        if (!att.link || typeof att.link !== 'string' || att.link.trim().length === 0) {
          return NextResponse.json({ error: `Attachment ${i + 1} is missing a link` }, { status: 400 });
        }
        if (!isValidUrl(att.link.trim())) {
          return NextResponse.json({ error: `Attachment ${i + 1} has an invalid URL` }, { status: 400 });
        }
        validatedAttachments.push({
          category: att.category,
          link: att.link.trim(),
        });
      }
      updateData.attachments = validatedAttachments;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: updatedTask, error: updateError } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .select(`
      *,
      creator:profiles!tasks_creator_profile_id_fkey(id, name, college, user_type, bio, skills, created_at)
    `)
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ task: updatedTask });
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
