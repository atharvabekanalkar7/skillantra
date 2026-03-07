import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// ─── POST /api/internships/[id]/applicants/[appId]/completion-letter ─────────

export async function POST(
    request: Request,
  { params }: any
) {

    const { id, appId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, user_type')
        .eq('user_id', user.id)
        .single();

    if (!userProfile || userProfile.user_type !== 'recruiter') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify ownership
    const { data: internship } = await supabase
        .from('internships')
        .select('id, recruiter_id, created_by')
        .eq('id', id)
        .single();

    if (!internship) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const ownerId = internship.recruiter_id || internship.created_by;
    if (ownerId !== userProfile.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { completion_letter_url } = body;

        if (!completion_letter_url) {
            return NextResponse.json({ error: 'completion_letter_url is required' }, { status: 400 });
        }

        const { data: updated, error } = await supabase
            .from('internship_applications')
            .update({ completion_letter_url })
            .eq('id', appId)
            .eq('internship_id', id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ data: updated });
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
