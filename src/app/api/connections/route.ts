import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!userProfile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { receiverId } = body;

    if (!receiverId) {
        return NextResponse.json({ error: 'Receiver ID required' }, { status: 400 });
    }

    if (receiverId === userProfile.id) {
        return NextResponse.json({ error: 'Cannot connect with yourself' }, { status: 400 });
    }

    const { data: existingConvo, error: existingError } = await supabase
        .from('dm_conversations')
        .select('id, status, ignored_at')
        .or(`and(sender_profile_id.eq.${userProfile.id},receiver_profile_id.eq.${receiverId}),and(sender_profile_id.eq.${receiverId},receiver_profile_id.eq.${userProfile.id})`)
        .maybeSingle();

    if (existingConvo) {
        if (existingConvo.status === 'ignored' && existingConvo.ignored_at) {
            const ignoredAt = new Date(existingConvo.ignored_at);
            const now = new Date();
            const diffMs = now.getTime() - ignoredAt.getTime();
            const hrs24 = 24 * 60 * 60 * 1000;

            if (diffMs < hrs24) {
                const remainingMs = hrs24 - diffMs;
                const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
                const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                return NextResponse.json({ error: `You can send a new request in ${hrs}h ${mins}m.` }, { status: 429 });
            } else {
                // Over 24 hrs, we update existing conversation to pending
                const { error: updateError } = await supabase
                    .from('dm_conversations')
                    .update({
                        status: 'pending',
                        sender_profile_id: userProfile.id,
                        receiver_profile_id: receiverId,
                        ignored_at: null,
                        unread_count_receiver: 1,
                        unread_count_sender: 0
                    })
                    .eq('id', existingConvo.id);

                if (updateError) {
                    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
                }
                return NextResponse.json({ success: true, conversationId: existingConvo.id }, { status: 201 });
            }
        }

        return NextResponse.json({ error: 'Conversation already exists' }, { status: 400 });
    }

    // Insert new conversation
    const { data: newConvo, error: insertError } = await supabase
        .from('dm_conversations')
        .insert({
            sender_profile_id: userProfile.id,
            receiver_profile_id: receiverId,
            status: 'pending',
            unread_count_receiver: 1,
            unread_count_sender: 0,
            last_message_at: new Date().toISOString()
        })
        .select('id')
        .single();

    if (insertError) {
        return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
    }

    return NextResponse.json({ success: true, conversationId: newConvo.id }, { status: 201 });
}

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
        return NextResponse.json({ error: 'Profile ID required' }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ status: 'none' }, { status: 200 });
    }

    const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!userProfile) return NextResponse.json({ status: 'none' }, { status: 200 });

    const { data: existingConvo, error } = await supabase
        .from('dm_conversations')
        .select('id, sender_profile_id, receiver_profile_id, status, ignored_at')
        .or(`and(sender_profile_id.eq.${userProfile.id},receiver_profile_id.eq.${profileId}),and(sender_profile_id.eq.${profileId},receiver_profile_id.eq.${userProfile.id})`)
        .maybeSingle();

    if (error || !existingConvo) {
        return NextResponse.json({ status: 'none' }, { status: 200 });
    }

    // Determine status
    if (existingConvo.status === 'active') {
        return NextResponse.json({ status: 'active' }, { status: 200 });
    }

    if (existingConvo.status === 'ignored') {
        return NextResponse.json({ status: 'ignored', ignored_at: existingConvo.ignored_at }, { status: 200 });
    }

    if (existingConvo.status === 'pending') {
        const isSender = existingConvo.sender_profile_id === userProfile.id;
        return NextResponse.json({ status: isSender ? 'pending_sent' : 'pending_received' }, { status: 200 });
    }

    return NextResponse.json({ status: 'none' }, { status: 200 });
}
