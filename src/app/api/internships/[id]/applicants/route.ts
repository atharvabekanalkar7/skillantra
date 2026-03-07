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
        .select('id, recruiter_id, title, company_name, stipend_min, stipend_max, is_unpaid, status')
        .eq('id', internshipId)
        .single();

    if (internError || !internship) {
        return NextResponse.json({ error: 'Internship not found' }, { status: 404 });
    }

    if (internship.recruiter_id !== userProfile.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch applications with applicant profiles and answers
    const { data: applications, error: appsError } = await supabase
        .from('internship_applications')
        .select(`
            id,
            internship_id,
            student_id,
            status,
            cover_letter,
            resume_url,
            linkedin_url,
            offer_letter_url,
            completion_letter_url,
            created_at,
            student_profile:profiles!internship_applications_student_id_fkey(name, college, skills, degree_level),
            answers:internship_application_answers(
                id, answer_text, answer_file_url,
                question:internship_questions(question_text)
            )
        `)
        .eq('internship_id', internshipId)
        .order('created_at', { ascending: false });

    if (appsError) {
        return NextResponse.json({ error: appsError.message }, { status: 500 });
    }

    // Format answers
    const formattedApps = applications?.map((app: any) => ({
        ...app,
        answers: app.answers?.map((ans: any) => ({
            id: ans.id,
            question_text: ans.question?.question_text || 'Unknown Question',
            answer_text: ans.answer_text,
            answer_file_url: ans.answer_file_url
        })) || []
    }));

    return NextResponse.json({ internship, applications: formattedApps || [] });
}
