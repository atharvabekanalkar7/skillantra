import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceEmailConfirmed } from '@/lib/api-helpers';
import { createNotification, sendEmail } from '@/lib/notifications';
import { newApplicationEmail } from '@/lib/email-templates';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const emailCheck = await enforceEmailConfirmed(user, user.id);
        if (emailCheck) return emailCheck;

        const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        if (profile.user_type !== 'student') {
            return NextResponse.json({ error: 'Only students can apply for internships' }, { status: 403 });
        }

        const formData = await req.formData();
        const internshipId = formData.get('internshipId') as string;
        const coverNote = formData.get('coverNote') as string;
        const linkedinUrl = formData.get('linkedinUrl') as string | null;
        const resumeSource = formData.get('resumeSource') as string;
        const existingResumeUrl = formData.get('existingResumeUrl') as string | null;
        const resumeFile = formData.get('resume') as File | null;
        const answersRaw = formData.get('answers') as string;
        const answers = answersRaw ? JSON.parse(answersRaw) : {};

        if (!internshipId || !coverNote) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Check Internship Status & Rate Limiting
        const { data: internship, error: intErr } = await supabase
            .from('internships')
            .select('id, recruiter_id, title, status, is_linkedin_mandatory, company_name')
            .eq('id', internshipId)
            .single();

        if (intErr || !internship) {
            return NextResponse.json({ error: 'Internship not found' }, { status: 404 });
        }

        // Allow 'approved' and wait maybe it was legacy 'open'
        if (internship.status !== 'approved' && internship.status !== 'open') {
            return NextResponse.json({ error: 'This internship is not open for applications' }, { status: 400 });
        }

        if (internship.is_linkedin_mandatory && !linkedinUrl) {
            return NextResponse.json({ error: 'LinkedIn URL is mandatory' }, { status: 400 });
        }

        // Rate limit: Max 3 applications per 48 hours for internships specifically
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { count, error: countErr } = await supabase
            .from('internship_applications')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', profile.id)
            .gte('created_at', twoDaysAgo);

        if (countErr) {
            console.error('Error checking rate limit:', countErr);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }

        if ((count || 0) >= 3) {
            return NextResponse.json({
                error: 'Rate limit exceeded: You can only submit 3 internship applications every 48 hours to ensure quality.'
            }, { status: 429 });
        }

        // Check if already applied
        const { data: existingApp } = await supabase
            .from('internship_applications')
            .select('id')
            .eq('internship_id', internshipId)
            .eq('student_id', profile.id)
            .single();

        if (existingApp) {
            return NextResponse.json({ error: 'You have already applied for this internship' }, { status: 400 });
        }

        // 2. Handle Resume Upload
        let finalResumeUrl = existingResumeUrl;

        if (resumeSource === 'upload' && resumeFile) {
            const fileExt = resumeFile.name.split('.').pop();
            const fileName = `${profile.id}/${crypto.randomUUID()}.${fileExt}`;

            const arrayBuffer = await resumeFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const { data: uploadData, error: uploadErr } = await supabase.storage
                .from('sk-resumes')
                .upload(fileName, buffer, {
                    contentType: resumeFile.type,
                    upsert: true
                });

            if (uploadErr) {
                console.error('Error uploading resume:', uploadErr);
                return NextResponse.json({ error: 'Failed to upload resume file' }, { status: 500 });
            }

            const { data: publicUrlData } = supabase.storage
                .from('sk-resumes')
                .getPublicUrl(fileName);

            finalResumeUrl = publicUrlData.publicUrl;
        }

        if (!finalResumeUrl) {
            return NextResponse.json({ error: 'A resume is required' }, { status: 400 });
        }

        // 3. Create Application
        const { data: newApp, error: appErr } = await supabase
            .from('internship_applications')
            .insert({
                internship_id: internshipId,
                student_id: profile.id,
                cover_letter: coverNote,
                resume_url: finalResumeUrl,
                linkedin_url: linkedinUrl || null,
                status: 'pending'
            })
            .select()
            .single();

        if (appErr || !newApp) {
            console.error('Error creating application:', appErr);
            return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
        }

        // 4. Save Custom Answers
        if (Object.keys(answers).length > 0) {
            const answerInserts = Object.keys(answers).map(qId => ({
                application_id: newApp.id,
                question_id: qId,
                answer_text: answers[qId]
            }));

            const { error: ansErr } = await supabase
                .from('internship_application_answers')
                .insert(answerInserts);

            if (ansErr) {
                console.error('Error saving answers:', ansErr);
            }
        }

        // 5. Notify the Recruiter
        await createNotification(
            internship.recruiter_id,
            'new_application',
            'New Internship Application',
            `${profile.name || 'A student'} applied for ${internship.title}.`,
            { link: `/internships/${internship.id}/applicants` }
        );

        // 6. Notify the Student
        await createNotification(
            profile.id,
            'system',
            'Application Submitted',
            `You successfully applied for ${internship.title} at ${internship.company_name || 'the company'}.`,
            { link: `/applications` }
        );

        return NextResponse.json({ success: true, applicationId: newApp.id });

    } catch (err: any) {
        console.error('Internship Application Route Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── GET /api/internship-applications — student's own applications ───────────

export async function GET(request: Request) {
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

    const { data: applications, error } = await supabase
        .from('internship_applications')
        .select('*')
        .eq('student_id', userProfile.id)
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Enrich with internship details
    if (applications && applications.length > 0) {
        const internshipIds = [...new Set(applications.map((a: any) => a.internship_id))];
        const { data: internships } = await supabase
            .from('internships')
            .select('id, title, company_name, company_logo_url, stipend_min, stipend_max, is_unpaid, duration_months, location, status')
            .in('id', internshipIds);

        const internshipMap: Record<string, any> = {};
        (internships || []).forEach((i: any) => { internshipMap[i.id] = i; });

        // Get answers for all applications
        const appIds = applications.map((a: any) => a.id);
        const { data: allAnswers } = await supabase
            .from('internship_application_answers')
            .select('*, question:internship_questions(*)')
            .in('application_id', appIds);

        const answerMap: Record<string, any[]> = {};
        (allAnswers || []).forEach((ans: any) => {
            if (!answerMap[ans.application_id]) answerMap[ans.application_id] = [];
            answerMap[ans.application_id].push(ans);
        });

        const enriched = applications.map((a: any) => ({
            ...a,
            internship: internshipMap[a.internship_id] || null,
            answers: answerMap[a.id] || [],
        }));
        return NextResponse.json({ data: enriched });
    }

    return NextResponse.json({ data: [] });
}
