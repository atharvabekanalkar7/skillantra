import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createNotification, sendEmail, sendWhatsApp } from '@/lib/notifications';
import { acceptanceEmail, rejectionEmail, offerLetterEmail } from '@/lib/email-templates';

export async function PATCH(
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
        .select('id, user_type, name, company_name')
        .eq('user_id', user.id)
        .single();

    if (!userProfile || userProfile.user_type !== 'recruiter') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify internship ownership
    const { data: internship } = await supabase
        .from('internships')
        .select('id, recruiter_id, title, company_name')
        .eq('id', id)
        .single();

    if (!internship) return NextResponse.json({ error: 'Internship not found' }, { status: 404 });

    if (internship.recruiter_id !== userProfile.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { status, offer_letter_url, completion_letter_url } = body;

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        // Get application
        const { data: application } = await supabase
            .from('internship_applications')
            .select('id, student_id, status')
            .eq('id', appId)
            .eq('internship_id', id)
            .single();

        if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

        const updateData: any = { status };
        if (offer_letter_url) updateData.offer_letter_url = offer_letter_url;
        if (completion_letter_url) updateData.completion_letter_url = completion_letter_url;

        const { data: updated, error } = await supabase
            .from('internship_applications')
            .update(updateData)
            .eq('id', appId)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Get student info for notifications
        const { data: student } = await supabase
            .from('profiles')
            .select('id, name, phone_number, user_id')
            .eq('id', application.student_id)
            .single();

        const internTitle = internship.title || 'Internship';
        const companyName = internship.company_name || userProfile.company_name || 'Company';

        if (student) {
            if (status === 'accepted') {
                await createNotification(
                    student.id, 'application_accepted',
                    `Congratulations! You've been accepted`,
                    `You've been accepted for ${internTitle} at ${companyName}. The recruiter will send an offer letter soon.`,
                    { internship_id: id, application_id: appId }
                );

                const { data: studentAuth } = await supabase.auth.admin.getUserById(student.user_id);
                if (studentAuth?.user?.email) {
                    const emailData = acceptanceEmail(student.name || 'Student', internTitle, companyName, userProfile.name || 'Recruiter');
                    await sendEmail(studentAuth.user.email, emailData.subject, emailData.html);
                }
            } else if (status === 'rejected') {
                await createNotification(
                    student.id, 'application_rejected',
                    `Update on your application`,
                    `Your application for ${internTitle} at ${companyName} was not selected.`,
                    { internship_id: id, application_id: appId }
                );

                const { data: studentAuth } = await supabase.auth.admin.getUserById(student.user_id);
                if (studentAuth?.user?.email) {
                    const emailData = rejectionEmail(student.name || 'Student', internTitle, companyName);
                    await sendEmail(studentAuth.user.email, emailData.subject, emailData.html);
                }
            } else if (status === 'offer_sent') {
                await createNotification(
                    student.id, 'offer_letter_received',
                    `Offer Letter Received`,
                    `You received an offer letter for ${internTitle} at ${companyName}.`,
                    { internship_id: id, application_id: appId }
                );

                const { data: studentAuth } = await supabase.auth.admin.getUserById(student.user_id);
                if (studentAuth?.user?.email) {
                    const emailData = offerLetterEmail(student.name || 'Student', companyName);
                    await sendEmail(studentAuth.user.email, emailData.subject, emailData.html);
                }
            }
        }

        return NextResponse.json({ data: updated });
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
