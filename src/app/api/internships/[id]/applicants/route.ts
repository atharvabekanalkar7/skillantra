import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enforceEmailConfirmed } from '@/lib/api-helpers';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: internshipId } = await params;
    const supabase = await createClient();
    const adminSupabase = createServiceRoleClient();

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
    // Note: We use adminSupabase to potentially fetch more details or handle complex joins if needed
    const { data: applications, error: appsError } = await adminSupabase
        .from('internship_applications')
        .select(`
            id,
            internship_id,
            student_id,
            status,
            cover_note,
            resume_url,
            linkedin_url,
            offer_letter_url,
            completion_letter_url,
            applied_at,
            skillantra_resume_id,
            rejection_reason,
            profiles!student_id (
                id,
                user_id,
                name,
                phone_number,
                degree_level,
                college,
                skills,
                bio
            ),
            answers:internship_application_answers(
                id, answer_text, file_url,
                question:internship_questions(question_text)
            )
        `)
        .eq('internship_id', internshipId)
        .order('applied_at', { ascending: false });

    if (appsError) {
        return NextResponse.json({ error: appsError.message }, { status: 500 });
    }

    // Enrichment with email using service role if needed
    if (applications && applications.length > 0) {
        for (const app of applications) {
            const profile = (Array.isArray(app.profiles) ? app.profiles[0] : app.profiles) as any;
            if (profile?.user_id) {
                const { data: { user: authUser } } = await adminSupabase.auth.admin.getUserById(profile.user_id);
                if (authUser?.email) {
                    profile.email = authUser.email;
                }
            }
        }
    }

    // Format answers
    const formattedApps = applications?.map((app: any) => {
        const profile = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
        return {
            ...app,
            profiles: profile || null,
            answers: app.answers?.map((ans: any) => ({
                id: ans.id,
                question_text: ans.question?.question_text || 'Unknown Question',
                answer_text: ans.answer_text,
                file_url: ans.file_url
            })) || []
        };
    });

    return NextResponse.json({ internship, applications: formattedApps || [] });
}
