import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();

    // 1. Authenticate Request
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch User's Profile ID
    const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (profileError || !userProfile) {
        return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    try {
        const body = await request.json();
        const { conversationId, content } = body;

        if (!conversationId || !content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json({ error: 'Conversation ID and message content are required.' }, { status: 400 });
        }

        // 3. Fetch Conversation and Lock State Matrix Verification
        const { data: conversation, error: convoError } = await supabase
            .from('dm_conversations')
            .select('id, sender_profile_id, receiver_profile_id, status, unread_count_sender, unread_count_receiver')
            .eq('id', conversationId)
            .single();

        if (convoError || !conversation) {
            return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
        }

        // Determine the user's role in this thread
        const isSender = conversation.sender_profile_id === userProfile.id;
        const isReceiver = conversation.receiver_profile_id === userProfile.id;

        if (!isSender && !isReceiver) {
            return NextResponse.json({ error: 'Unauthorized access to conversation.' }, { status: 403 });
        }

        // --- 4. PERMISSION MATRIX ENFORCEMENT ---

        if (conversation.status === 'ignored') {
            return NextResponse.json({ error: 'This conversation is ignored. You cannot send further messages.' }, { status: 403 });
        }

        if (conversation.status === 'pending') {
            if (isSender) {
                return NextResponse.json({ error: 'Please wait for the user to respond before sending more messages.' }, { status: 403 });
            }
            if (isReceiver) {
                return NextResponse.json({ error: 'You must accept the request before messaging.' }, { status: 403 });
            }
        }

        // 5. Update Conversation Metadata (timestamps and unread counts)
        const updates: any = {
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (isSender) {
            // Sender wrote a message, Receiver's unread goes up
            updates.unread_count_receiver = (conversation.unread_count_receiver || 0) + 1;
        } else {
            // Receiver wrote a message, Sender's unread goes up
            updates.unread_count_sender = (conversation.unread_count_sender || 0) + 1;
        }

        await supabase
            .from('dm_conversations')
            .update(updates)
            .eq('id', conversationId);


        // 6. Insert Message
        const { data: message, error: messageError } = await supabase
            .from('dm_messages')
            .insert({
                conversation_id: conversationId,
                sender_profile_id: userProfile.id,
                content: content.trim()
            })
            .select()
            .single();

        if (messageError) {
            console.error('Message insert error:', messageError);
            return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message }, { status: 201 });

    } catch (err: any) {
        console.error('Message Send API error:', err);
        return NextResponse.json({ error: 'Internal server error while sending message' }, { status: 500 });
    }
}
