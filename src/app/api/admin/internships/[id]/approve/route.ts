import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createNotification, sendEmail } from '@/lib/notifications';
import { internshipApprovedEmail } from '@/lib/email-templates';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'fallback-secret-for-dev';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const expectedToken = crypto.createHmac('sha256', ADMIN_SECRET).update(id).digest('hex');
    if (token !== expectedToken) return NextResponse.json({ error: 'Invalid token' }, { status: 403 });

    const supabase = await createClient();

    const { data: internship, error } = await supabase
        .from('internships')
        .update({ status: 'approved' })
        .eq('id', id)
        .select('*, recruiter:profiles!internships_recruiter_id_fkey(id, user_id, name)')
        .single();

    if (error || !internship) {
        return NextResponse.json({ error: error?.message || 'Failed to approve internship' }, { status: 500 });
    }

    // Ensure recruiter gets verified if they weren't
    if (internship.recruiter?.id) {
        await supabase.from('profiles').update({ is_verified: true }).eq('id', internship.recruiter.id);
    }

    // Notify recruiter
    if (internship.recruiter?.user_id) {
        const { data: authUser } = await supabase.auth.admin.getUserById(internship.recruiter.user_id);
        if (authUser?.user?.email) {
            const emailData = internshipApprovedEmail(internship.recruiter.name || 'Recruiter', internship.title, 'https://skillantra.in/internships/mine');
            await sendEmail(authUser.user.email, emailData.subject, emailData.html);
        }

        await createNotification(
            internship.recruiter.id,
            'internship_approved',
            'Internship Approved!',
            `Your listing for ${internship.title} has been approved and is now live.`,
            { internship_id: id }
        );
    }

    return new NextResponse(`
        <html>
            <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
                <div style="text-align: center; padding: 2rem; background: #1e293b; border-radius: 1rem; border: 1px solid #334155;">
                    <h1 style="color: #10b981; margin-bottom: 0.5rem;">✅ Internship Approved</h1>
                    <p style="color: #94a3b8;">The internship has been marked as approved and the recruiter has been notified.</p>
                </div>
            </body>
        </html>
    `, { headers: { 'Content-Type': 'text/html' } });
}
