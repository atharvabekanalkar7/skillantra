import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enforceEmailConfirmed } from '@/lib/api-helpers';

export async function GET(request: Request) {
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

    // Fetch open one_on_one collaboration posts (newest first)
    const { data: posts, error } = await supabase
        .from('collaboration_posts')
        .select(`
      *,
      creator:profiles!collaboration_posts_created_by_fkey(id, name, college, avatar_url)
    `)
        .eq('collab_type', 'one_on_one')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

    if (error) {
        const isTableNotFound =
            error.message?.includes('schema cache') ||
            error.message?.includes('does not exist') ||
            error.code === '42P01';

        if (isTableNotFound) {
            return NextResponse.json({ posts: [], error: 'Collaboration tables not found. Please run the migration SQL.' }, { status: 200 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch IDs of posts the current user already requested on
    const { data: myRequests } = await supabase
        .from('collaboration_requests')
        .select('post_id')
        .eq('requester_id', userProfile.id);

    const requestedPostIds = (myRequests || []).map((r: any) => r.post_id);

    return NextResponse.json({
        posts: posts || [],
        requestedPostIds,
        currentProfileId: userProfile.id,
    });
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
    const { title, description, skills_needed } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
        return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const skillsArray = Array.isArray(skills_needed)
        ? skills_needed.filter((s: any) => typeof s === 'string' && s.trim().length > 0).map((s: string) => s.trim())
        : [];

    const { data: newPost, error: insertError } = await supabase
        .from('collaboration_posts')
        .insert({
            created_by: userProfile.id,
            collab_type: 'one_on_one',
            title: title.trim(),
            description: description.trim(),
            skills_needed: skillsArray,
            campus: 'iitmandi',
            is_cross_campus: false,
            status: 'open',
        })
        .select()
        .single();

    if (insertError) {
        const isTableNotFound =
            insertError.message?.includes('schema cache') ||
            insertError.message?.includes('does not exist') ||
            insertError.code === '42P01';

        if (isTableNotFound) {
            return NextResponse.json({ error: 'Collaboration tables not found. Please run the migration SQL.' }, { status: 500 });
        }
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ post: newPost }, { status: 201 });
}
