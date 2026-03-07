import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enforceEmailConfirmed } from '@/lib/api-helpers';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: internshipId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const emailCheck = await enforceEmailConfirmed(user, user.id);
    if (emailCheck) return emailCheck;

    // Verify this internship belongs to the current user (recruiter view)
    const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!userProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const { data: internship, error: internError } = await supabase
        .from('internships')
        .select('id, created_by')
        .eq('id', internshipId)
        .single();

    if (internError || !internship) {
        return NextResponse.json({ error: 'Internship not found' }, { status: 404 });
    }

    if (internship.created_by !== userProfile.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch applications with applicant profiles
    const { data: applications, error: appsError } = await supabase
        .from('task_applications')
        .select(`
      id,
      internship_id,
      applicant_profile_id,
      status,
      payment_status,
      cover_note,
      created_at,
      applicant:profiles!task_applications_applicant_profile_id_fkey(id, name, college, skills)
    `)
        .eq('internship_id', internshipId)
        .order('created_at', { ascending: false });

    if (appsError) {
        return NextResponse.json({ error: appsError.message }, { status: 500 });
    }

    return NextResponse.json({ applications: applications || [] });
}
