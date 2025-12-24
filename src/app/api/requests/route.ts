import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enforceEmailConfirmed } from '@/lib/api-helpers';

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

  const body = await request.json();
  const { receiver_id, message } = body;

  if (!receiver_id || typeof receiver_id !== 'string') {
    return NextResponse.json({ error: 'Receiver ID is required' }, { status: 400 });
  }

  const { data: senderProfile, error: senderError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (senderError || !senderProfile) {
    return NextResponse.json({ error: 'Profile not found. Please create your profile first.' }, { status: 404 });
  }

  if (senderProfile.id === receiver_id) {
    return NextResponse.json({ error: 'Cannot send request to yourself' }, { status: 400 });
  }

  const { data: receiverProfile, error: receiverError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', receiver_id)
    .single();

  if (receiverError || !receiverProfile) {
    return NextResponse.json({ error: 'Receiver profile not found' }, { status: 404 });
  }

  const { data: existingRequest } = await supabase
    .from('collaboration_requests')
    .select('id, status')
    .eq('sender_id', senderProfile.id)
    .eq('receiver_id', receiver_id)
    .eq('status', 'pending')
    .single();

  if (existingRequest) {
    return NextResponse.json({ error: 'Request already sent' }, { status: 400 });
  }

  const { data: newRequest, error: insertError } = await supabase
    .from('collaboration_requests')
    .insert({
      sender_id: senderProfile.id,
      receiver_id,
      message: message ? message.trim() : null,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ request: newRequest }, { status: 201 });
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
  const { request_id, status } = body;

  if (!request_id || typeof request_id !== 'string') {
    return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
  }

  if (!status || !['accepted', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Valid status (accepted or rejected) is required' }, { status: 400 });
  }

  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !userProfile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const { data: existingRequest, error: fetchError } = await supabase
    .from('collaboration_requests')
    .select('*')
    .eq('id', request_id)
    .single();

  if (fetchError || !existingRequest) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (existingRequest.receiver_id !== userProfile.id) {
    return NextResponse.json({ error: 'Only the receiver can respond to this request' }, { status: 403 });
  }

  if (existingRequest.status !== 'pending') {
    return NextResponse.json({ error: 'Request has already been responded to' }, { status: 400 });
  }

  const { data: updatedRequest, error: updateError } = await supabase
    .from('collaboration_requests')
    .update({
      status,
      responded_at: new Date().toISOString(),
    })
    .eq('id', request_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ request: updatedRequest });
}

