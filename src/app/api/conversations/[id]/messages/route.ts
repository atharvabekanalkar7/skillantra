import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
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

    // 3. Fetch conversation metadata
    const { data: conversation, error: convoError } = await supabase
        .from('dm_conversations')
        .select(`
            *,
            sender:profiles!dm_conversations_sender_profile_id_fkey(id, name, user_type),
            receiver:profiles!dm_conversations_receiver_profile_id_fkey(id, name, user_type)
        `)
        .eq('id', conversationId)
        .single();

    if (convoError || !conversation) {
        return NextResponse.json({ error: 'Conversation not found or access denied.' }, { status: 404 });
    }

    const isSender = conversation.sender_profile_id === userProfile.id;
    const isReceiver = conversation.receiver_profile_id === userProfile.id;

    // Ensure the user actually belongs to this conversation
    if (!isSender && !isReceiver) {
        return NextResponse.json({ error: 'Unauthorized access to conversation.' }, { status: 403 });
    }

    // 4. Fetch the message thread
    const { data: messages, error: msgError } = await supabase
        .from('dm_messages')
        .select('id, sender_profile_id, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true }); // Chronological order

    if (msgError) {
        return NextResponse.json({ error: 'Failed to load message thread.' }, { status: 500 });
    }

    // Return unified payload
    return NextResponse.json({
        conversation: {
            ...conversation,
            is_sender: isSender,
            is_receiver: isReceiver,
            other_user: isSender ? conversation.receiver : conversation.sender
        },
        messages: messages || []
    }, { status: 200 });
}
