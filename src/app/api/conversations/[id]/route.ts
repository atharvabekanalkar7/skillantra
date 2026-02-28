import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    const supabase = await createClient();

    // 1. Authenticate Request
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch User's Profile ID to verify access
    const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (profileError || !userProfile) {
        return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const conversationId = resolvedParams.id;

    if (!conversationId) {
        return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { status, markRead } = body;

        // 3. Fetch conversation metadata
        const { data: conversation, error: convoError } = await supabase
            .from('dm_conversations')
            .select('sender_profile_id, receiver_profile_id, status')
            .eq('id', conversationId)
            .single();

        if (convoError || !conversation) {
            return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
        }

        const isSender = conversation.sender_profile_id === userProfile.id;
        const isReceiver = conversation.receiver_profile_id === userProfile.id;

        if (!isSender && !isReceiver) {
            return NextResponse.json({ error: 'Unauthorized to access this conversation.' }, { status: 403 });
        }

        const updates: any = { updated_at: new Date().toISOString() };

        // Handle mark as read
        if (markRead) {
            if (isSender) {
                updates.unread_count_sender = 0;
            } else {
                updates.unread_count_receiver = 0;
            }
        }

        // Handle status change
        if (status) {
            if (!['active', 'ignored'].includes(status)) {
                return NextResponse.json({ error: 'Invalid status update. Must be active or ignored.' }, { status: 400 });
            }

            // Only the receiver can transition from pending -> active/ignored
            if (!isReceiver) {
                return NextResponse.json({ error: 'Only the receiver can accept or ignore a request.' }, { status: 403 });
            }

            if (conversation.status !== 'pending') {
                return NextResponse.json({ error: 'Conversation is not in a pending state.' }, { status: 400 });
            }

            updates.status = status;
        }

        if (Object.keys(updates).length === 1) { // Only updated_at
            return NextResponse.json({ success: true, message: 'No updates provided' }, { status: 200 });
        }

        // 4. Update the DB
        const { data: updatedConvo, error: updateError } = await supabase
            .from('dm_conversations')
            .update(updates)
            .eq('id', conversationId)
            .select()
            .single();

        if (updateError) {
            console.error('Conversation update error:', updateError);
            return NextResponse.json({ error: 'Failed to update conversation.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, conversation: updatedConvo }, { status: 200 });

    } catch (err: any) {
        console.error('Conversation PATCH API error:', err);
        return NextResponse.json({ error: 'Internal server error while updating conversation' }, { status: 500 });
    }
}
