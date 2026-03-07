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

    // Query 1: Fetch user's own posts
    const { data: myPosts, error: postsError } = await supabase
        .from('collaboration_posts')
        .select('*')
        .eq('created_by', userProfile.id)
        .eq('collab_type', 'one_on_one')
        .order('created_at', { ascending: false });

    if (postsError) {
        console.log(postsError);
        return NextResponse.json({ error: postsError.message, code: postsError.code }, { status: 500 });
    }

    // Fetch the nested requests for myPosts separately
    const myPostIds = (myPosts || []).map((p: any) => p.id);
    let allRequests: any[] = [];

    if (myPostIds.length > 0) {
        const { data: reqs, error: reqsError } = await supabase
            .from('collaboration_requests')
            .select(`
                *,
                requester:profiles!collaboration_requests_requester_id_fkey(id, name, college)
            `)
            .in('post_id', myPostIds);

        if (reqsError) {
            console.log(reqsError);
            return NextResponse.json({ error: reqsError.message, code: reqsError.code }, { status: 500 });
        }
        allRequests = reqs || [];
    }

    const postsWithRequests = (myPosts || []).map((post: any) => ({
        ...post,
        collaboration_requests: allRequests.filter((r: any) => r.post_id === post.id)
    }));

    // Query 3: Fetch requests the user has sent
    const { data: myRequestsData, error: requestsError } = await supabase
        .from('collaboration_requests')
        .select('*')
        .eq('requester_id', userProfile.id)
        .order('created_at', { ascending: false });

    if (requestsError) {
        console.log(requestsError);
        return NextResponse.json({ error: requestsError.message, code: requestsError.code }, { status: 500 });
    }

    // Fetch the related posts for the requests separately
    const requestedPostIds = (myRequestsData || []).map((r: any) => r.post_id);
    let relatedPosts: any[] = [];

    if (requestedPostIds.length > 0) {
        const { data: relPosts, error: relPostsError } = await supabase
            .from('collaboration_posts')
            .select(`
                id, title, description, skills_needed, status, created_at,
                creator:profiles!collaboration_posts_created_by_fkey(id, name)
            `)
            .in('id', requestedPostIds);

        if (relPostsError) {
            console.log(relPostsError);
            return NextResponse.json({ error: relPostsError.message, code: relPostsError.code }, { status: 500 });
        }
        relatedPosts = relPosts || [];
    }

    const myRequestsWithPosts = (myRequestsData || []).map((req: any) => ({
        ...req,
        post: relatedPosts.find((p: any) => p.id === req.post_id) || null
    }));

    return NextResponse.json({
        myPosts: postsWithRequests,
        myRequests: myRequestsWithPosts,
    });
}
