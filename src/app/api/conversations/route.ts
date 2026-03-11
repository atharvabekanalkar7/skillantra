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

    // Enforce email confirmation 
    const emailCheck = await enforceEmailConfirmed(user, user.id);
    if (emailCheck) return emailCheck;

    // Verify sender profile exists
    const { data: senderProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (profileError || !senderProfile) {
        return NextResponse.json({ error: 'Profile not found. Please create your profile first.' }, { status: 404 });
    }

    try {
        const body = await request.json();
        const { receiverId, messageContent } = body;

        if (!receiverId || !messageContent || typeof messageContent !== 'string' || messageContent.trim().length === 0) {
            return NextResponse.json({ error: 'Receiver ID and a message are required.' }, { status: 400 });
        }

        // 1. Prevent messaging oneself
        if (receiverId === senderProfile.id) {
            return NextResponse.json({ error: 'You cannot send a message to yourself.' }, { status: 400 });
        }

        // 2. Verify receiver exists
        const { data: receiverProfile, error: receiverError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', receiverId)
            .single();

        if (receiverError || !receiverProfile) {
            return NextResponse.json({ error: 'Receiver profile not found.' }, { status: 404 });
        }

        // 3. Pre-check if conversation already exists
        const { data: existingConvo, error: existingError } = await supabase
            .from('dm_conversations')
            .select('id, status')
            .or(`and(sender_profile_id.eq.${senderProfile.id},receiver_profile_id.eq.${receiverId}),and(sender_profile_id.eq.${receiverId},receiver_profile_id.eq.${senderProfile.id})`)
            .maybeSingle();

        if (existingError && existingError.code !== 'PGRST116') {
            return NextResponse.json({ error: 'Failed to verify existing conversation.' }, { status: 500 });
        }

        if (existingConvo) {
            return NextResponse.json({
                error: 'A conversation already exists with this user.',
                conversationId: existingConvo.id,
                status: existingConvo.status
            }, { status: 409 });
        }

        // 4. Create conversation
        const { data: conversation, error: convoError } = await supabase
            .from('dm_conversations')
            .insert({
                sender_profile_id: senderProfile.id,
                receiver_profile_id: receiverId,
                status: 'pending',
                unread_count_sender: 0,
                unread_count_receiver: 1, // 1 unread message for receiver
                last_message_at: new Date().toISOString()
            })
            .select('id')
            .single();

        let conversationId = conversation?.id;

        if (convoError) {
            return NextResponse.json({ error: 'Failed to create conversation thread.' }, { status: 500 });
        }

        // 5. Insert the actual initial message
        if (conversationId) {
            const { data: message, error: messageError } = await supabase
                .from('dm_messages')
                .insert({
                    conversation_id: conversationId,
                    sender_profile_id: senderProfile.id,
                    content: messageContent.trim()
                })
                .select()
                .single();

            if (messageError) {
                console.error('Initial message insert failed:', messageError);
                return NextResponse.json({ error: 'Failed to send the initial message.' }, { status: 500 });
            }

            return NextResponse.json({ success: true, conversationId: conversationId, message }, { status: 201 });
        }

        return NextResponse.json({ error: 'Failed to create conversation thread.' }, { status: 500 });

    } catch (err: any) {
        console.error('Collaboration Request API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    // Demo Mode Check
    const { searchParams } = new URL(request.url);
    const isDemo = searchParams.get('demo') === 'true' || request.headers.get('referer')?.includes('demo=true');

    if (isDemo) {
        return NextResponse.json({
            conversations: [
                {
                    id: 'demo-convo-1',
                    status: 'accepted',
                    last_message_at: new Date().toISOString(),
                    is_sender: false,
                    other_user: {
                        id: 'demo-user-2',
                        name: 'Jane Smith',
                        user_type: 'SkillHolder'
                    },
                    unread_count: 1,
                    last_message: {
                        content: 'Hey, I saw your project and would love to collaborate!',
                        created_at: new Date().toISOString()
                    }
                }
            ],
            totalUnreadCount: 1
        });
    }

    const supabase = await createClient();

    // 1. Authenticate Request
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch User's Profile ID to identify conversations
    const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (profileError || !userProfile) {
        return NextResponse.json({ error: 'Profile not found. Please create your profile first.' }, { status: 404 });
    }

    // 3. Fetch all conversations where user is EITHER sender OR receiver
    try {
        const { data: conversations, error: convoError } = await supabase
            .from('dm_conversations')
            .select(`
                *,
                sender:profiles!dm_conversations_sender_profile_id_fkey(id, name, user_type),
                receiver:profiles!dm_conversations_receiver_profile_id_fkey(id, name, user_type),
                last_message:dm_messages(content, created_at)
            `)
            .or(`sender_profile_id.eq.${userProfile.id},receiver_profile_id.eq.${userProfile.id}`)
            .order('last_message_at', { ascending: false });

        if (convoError) {
            // Check if table missing
            if (convoError.code === '42P01') {
                return NextResponse.json({ conversations: [], error: 'Messaging system is not yet initialized on the server. Please run the migration.' }, { status: 500 });
            }
            throw convoError;
        }

        // Format the response:
        const formattedConvos = (conversations || []).map(c => {
            // Find the most recent message if Array returned
            let latestMessage = null;
            if (c.last_message && Array.isArray(c.last_message) && c.last_message.length > 0) {
                // Sort descending by created_at and pick the first
                latestMessage = c.last_message.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            } else if (c.last_message && !Array.isArray(c.last_message)) {
                latestMessage = c.last_message;
            }

            const isSender = c.sender_profile_id === userProfile.id;
            const otherUser = isSender ? c.receiver : c.sender;
            const unreadCount = isSender ? c.unread_count_sender : c.unread_count_receiver;

            return {
                id: c.id,
                status: c.status,
                created_at: c.created_at,
                updated_at: c.updated_at,
                ignored_at: c.ignored_at,
                last_message_at: c.last_message_at,
                is_sender: isSender,
                other_user: otherUser,
                unread_count: unreadCount,
                last_message: latestMessage
            };
        });

        // Count conversations where current user has unread_count > 0, excluding ignored
        const totalUnreadCount = conversations.filter(c => {
            if (c.status === 'ignored') return false; // exclude ignored
            const isReceiver = c.receiver_profile_id === userProfile.id
            const unread = isReceiver ? (c.unread_count_receiver || 0) : (c.unread_count_sender || 0)
            return unread > 0
        }).length;

        return NextResponse.json({
            conversations: formattedConvos,
            totalUnreadCount
        }, { status: 200 });

    } catch (err: any) {
        console.error('Conversations Fetch API error:', err);
        return NextResponse.json({ error: 'Internal server error while fetching conversations' }, { status: 500 });
    }
}
