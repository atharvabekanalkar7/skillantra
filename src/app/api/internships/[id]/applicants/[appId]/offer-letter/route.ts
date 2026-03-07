import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createNotification, sendEmail } from '@/lib/notifications';
import { offerLetterEmail } from '@/lib/email-templates';

// ─── POST /api/internships/[id]/applicants/[appId]/offer-letter ──────────────

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
        .select('id, recruiter_id, created_by, company_name')
        .eq('id', id)
        .single();

    if (!internship) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const ownerId = internship.recruiter_id || internship.created_by;
    if (ownerId !== userProfile.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { offer_letter_url } = body;

        if (!offer_letter_url) {
            return NextResponse.json({ error: 'offer_letter_url is required' }, { status: 400 });
        }

        const { data: updated, error } = await supabase
            .from('internship_applications')
            .update({ offer_letter_url, offer_letter_reminder_sent: true })
            .eq('id', appId)
            .eq('internship_id', id)
            .select('*, student_id')
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Notify student
        if (updated.student_id) {
            const { data: student } = await supabase
                .from('profiles')
                .select('id, name, user_id')
                .eq('id', updated.student_id)
                .single();

            if (student) {
                await createNotification(
                    student.id, 'offer_letter_ready',
                    `Your offer letter is ready`,
                    `Your offer letter from ${internship.company_name} has been uploaded.`,
                    { internship_id: id, application_id: appId }
                );

                const { data: studentAuth } = await supabase.auth.admin.getUserById(student.user_id);
                if (studentAuth?.user?.email) {
                    const emailData = offerLetterEmail(student.name || 'Student', internship.company_name || 'Company');
                    await sendEmail(studentAuth.user.email, emailData.subject, emailData.html);
                }
            }
        }

        return NextResponse.json({ data: updated });
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
