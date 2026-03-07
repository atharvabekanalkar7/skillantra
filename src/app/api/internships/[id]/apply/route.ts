import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enforceEmailConfirmed } from '@/lib/api-helpers';

/** GET /api/internships/[id]/apply — check if current user has already applied */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: internshipId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ applied: false });

    const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!userProfile) return NextResponse.json({ applied: false });

    const { data: existing } = await supabase
        .from('task_applications')
        .select('id, status')
        .eq('internship_id', internshipId)
        .eq('applicant_profile_id', userProfile.id)
        .maybeSingle();

    return NextResponse.json({ applied: !!existing, application: existing ?? null });
}

/** POST /api/internships/[id]/apply — submit an application */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: internshipId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emailCheck = await enforceEmailConfirmed(user, user.id);
    if (emailCheck) return emailCheck;

    const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!userProfile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify internship exists + is open
    const { data: internship, error: internError } = await supabase
        .from('internships')
        .select('id, status, created_by')
        .eq('id', internshipId)
        .single();

    if (internError || !internship) {
        return NextResponse.json({ error: 'Internship not found' }, { status: 404 });
    }

    if (internship.status !== 'open') {
        return NextResponse.json({ error: 'This internship is no longer accepting applications' }, { status: 400 });
    }

    if (internship.created_by === userProfile.id) {
        return NextResponse.json({ error: 'You cannot apply to your own internship' }, { status: 400 });
    }

    // Guard against duplicate applications
    const { data: existing } = await supabase
        .from('task_applications')
        .select('id')
        .eq('internship_id', internshipId)
        .eq('applicant_profile_id', userProfile.id)
        .maybeSingle();

    if (existing) {
        return NextResponse.json({ error: 'You have already applied to this internship' }, { status: 400 });
    }

    // Parse cover note
    const body = await request.json().catch(() => ({}));
    const coverNote = typeof body.cover_note === 'string' ? body.cover_note.trim().slice(0, 2000) : null;

    const { data: newApp, error: insertError } = await supabase
        .from('task_applications')
        .insert({
            internship_id: internshipId,
            applicant_profile_id: userProfile.id,
            status: 'pending',
            cover_note: coverNote || null,
        })
        .select()
        .single();

    if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ application: newApp }, { status: 201 });
}
