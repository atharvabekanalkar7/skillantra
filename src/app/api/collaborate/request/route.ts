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

    const emailCheck = await enforceEmailConfirmed(user, user.id);
    if (emailCheck) return emailCheck;

    const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_type')
        .eq('user_id', user.id)
        .single();

    if (profileError || !userProfile) {
        return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    if (userProfile.user_type === 'recruiter') {
        return NextResponse.json({ error: 'Recruiters cannot send collaboration requests' }, { status: 403 })
    }

    const body = await request.json();
    const { post_id, message } = body;

    if (!post_id) {
        return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
    }

    // Verify the post exists and user is not the creator
    const { data: post, error: postError } = await supabase
        .from('collaboration_posts')
        .select('id, created_by, status')
        .eq('id', post_id)
        .single();

    if (postError || !post) {
        return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    if (post.created_by === userProfile.id) {
        return NextResponse.json({ error: 'You cannot request on your own post.' }, { status: 400 });
    }

    if (post.status !== 'open') {
        return NextResponse.json({ error: 'This post is no longer accepting requests.' }, { status: 400 });
    }

    const { data: newRequest, error: insertError } = await supabase
        .from('collaboration_requests')
        .insert({
            post_id,
            requester_id: userProfile.id,
            message: message ? message.trim() : null,
            status: 'pending',
        })
        .select()
        .single();

    if (insertError) {
        if (insertError.code === '23505') {
            return NextResponse.json({ error: 'You have already sent a request for this post.' }, { status: 409 });
        }
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ request: newRequest }, { status: 201 });
}
