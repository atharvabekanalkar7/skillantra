import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createNotification, sendEmail } from '@/lib/notifications';

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
        .update({ status: 'rejected' })
        .eq('id', id)
        .select('*, recruiter:profiles!internships_recruiter_id_fkey(id, user_id, name)')
        .single();

    if (error || !internship) {
        return NextResponse.json({ error: error?.message || 'Failed to reject internship' }, { status: 500 });
    }

    // Notify recruiter
    if (internship.recruiter?.user_id) {
        const { data: authUser } = await supabase.auth.admin.getUserById(internship.recruiter.user_id);
        if (authUser?.user?.email) {
            await sendEmail(
                authUser.user.email,
                'Internship Listing Update - Skillantra',
                `
                <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0f172a;">Update on your listing</h2>
                    <p>Hi ${internship.recruiter.name},</p>
                    <p>Unfortunately, your internship listing "<strong>${internship.title}</strong>" was not approved to be published on Skillantra.</p>
                    <p>If you have any questions or need to make changes, please reply to this email.</p>
                </div>
                `
            );
        }

        await createNotification(
            internship.recruiter.id,
            'internship_rejected',
            'Internship Not Approved',
            `Your listing for ${internship.title} could not be approved at this time.`,
            { internship_id: id }
        );
    }

    return new NextResponse(`
        <html>
            <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
                <div style="text-align: center; padding: 2rem; background: #1e293b; border-radius: 1rem; border: 1px solid #334155;">
                    <h1 style="color: #e11d48; margin-bottom: 0.5rem;">❌ Internship Rejected</h1>
                    <p style="color: #94a3b8;">The internship has been marked as rejected and the recruiter has been notified.</p>
                </div>
            </body>
        </html>
    `, { headers: { 'Content-Type': 'text/html' } });
}
