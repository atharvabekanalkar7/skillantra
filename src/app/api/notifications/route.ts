import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// ─── GET /api/notifications — current user's notifications ──────────────────

export async function GET(request: Request) {
    // Demo Mode Check
    const { searchParams } = new URL(request.url);
    const isDemo = searchParams.get('demo') === 'true' || request.headers.get('referer')?.includes('demo=true');

    if (isDemo) {
        return NextResponse.json({
            data: [
                {
                    id: 'demo-notif-1',
                    user_id: 'demo-profile-id',
                    type: 'internship_applied',
                    title: 'Application Received',
                    body: 'Your application for Full Stack Developer has been received.',
                    is_read: false,
                    created_at: new Date().toISOString(),
                    metadata: {}
                },
                {
                    id: 'demo-notif-2',
                    user_id: 'demo-profile-id',
                    type: 'internship_accepted',
                    title: 'Congratulations!',
                    body: 'You have been accepted for the UI/UX Design internship.',
                    is_read: true,
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    metadata: {}
                }
            ],
            unread_count: 1
        });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!userProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get unread count
    const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile.id)
        .eq('is_read', false);

    return NextResponse.json({ data: notifications || [], unread_count: count || 0 });
}
