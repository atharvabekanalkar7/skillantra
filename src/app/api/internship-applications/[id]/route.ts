import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enforceEmailConfirmed } from '@/lib/api-helpers';

// ─── PATCH /api/internship-applications/[id] — withdraw ─────────────────────

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();
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

    if (!userProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    // Fetch application with internship details to check ownership
    const { data: application, error: appError } = await supabase
        .from('internship_applications')
        .select(`
            id, 
            student_id, 
            status, 
            internship_id,
            internship:internships(id, recruiter_id)
        `)
        .eq('id', id)
        .single();

    if (appError || !application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const internship: any = application.internship;
    const isStudent = application.student_id === userProfile.id;
    const isRecruiter = internship?.recruiter_id === userProfile.id;

    if (!isStudent && !isRecruiter) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Capture update fields from body
    const { status, offer_letter_url, completion_letter_url } = body;
    const updateData: any = {};

    if (isStudent) {
        // Only allow withdrawal for students
        if (status !== 'withdrawn') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (application.status !== 'pending') {
            return NextResponse.json({ error: 'Only pending applications can be withdrawn' }, { status: 400 });
        }
        updateData.status = 'withdrawn';
    } else if (isRecruiter) {
        // Recruiters can update status and upload letters
        if (status) updateData.status = status;
        if (offer_letter_url) updateData.offer_letter_url = offer_letter_url;
        if (completion_letter_url) updateData.completion_letter_url = completion_letter_url;
    }

    const { data: updated, error: updateError } = await supabase
        .from('internship_applications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ data: updated });
}
