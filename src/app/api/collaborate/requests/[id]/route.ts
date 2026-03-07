import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enforceEmailConfirmed } from '@/lib/api-helpers';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: requestId } = await params;
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emailCheck = await enforceEmailConfirmed(user, user.id);
    if (emailCheck) return emailCheck;

    const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (profileError || !userProfile) {
        return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['accepted', 'rejected'].includes(status)) {
        return NextResponse.json({ error: 'Status must be "accepted" or "rejected".' }, { status: 400 });
    }

    // Fetch the request + its parent post
    const { data: collabRequest, error: reqError } = await supabase
        .from('collaboration_requests')
        .select(`
      *,
      post:collaboration_posts!collaboration_requests_post_id_fkey(id, created_by, title)
    `)
        .eq('id', requestId)
        .single();

    if (reqError || !collabRequest) {
        return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    }

    // Verify the current user owns the parent post
    if (collabRequest.post?.created_by !== userProfile.id) {
        return NextResponse.json({ error: 'You are not authorized to update this request.' }, { status: 403 });
    }

    // Update request status
    const { error: updateError } = await supabase
        .from('collaboration_requests')
        .update({ status })
        .eq('id', requestId);

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If accepted, create a DM conversation between the post creator and requester
    if (status === 'accepted') {
        const { data: conversation, error: convoError } = await supabase
            .from('dm_conversations')
            .insert({
                sender_profile_id: userProfile.id,
                receiver_profile_id: collabRequest.requester_id,
                status: 'pending',
                unread_count_sender: 0,
                unread_count_receiver: 1,
                last_message_at: new Date().toISOString(),
            })
            .select('id')
            .single();

        let conversationId = conversation?.id;

        if (convoError) {
            if (convoError.code === '23505') {
                // Conversation already exists — find it
                const { data: existingConvo } = await supabase
                    .from('dm_conversations')
                    .select('id')
                    .or(
                        `and(sender_profile_id.eq.${userProfile.id},receiver_profile_id.eq.${collabRequest.requester_id}),and(sender_profile_id.eq.${collabRequest.requester_id},receiver_profile_id.eq.${userProfile.id})`
                    )
                    .single();
                conversationId = existingConvo?.id;
            } else {
                console.error('Failed to create DM conversation:', convoError);
            }
        }

        // Send an automatic initial message
        if (conversationId) {
            const postTitle = collabRequest.post?.title || 'your collaboration post';
            await supabase.from('dm_messages').insert({
                conversation_id: conversationId,
                sender_profile_id: userProfile.id,
                content: `Hey! I accepted your help request for "${postTitle}". Let's collaborate! 🤝`,
            });
        }

        return NextResponse.json({ success: true, conversationId });
    }

    return NextResponse.json({ success: true });
}
