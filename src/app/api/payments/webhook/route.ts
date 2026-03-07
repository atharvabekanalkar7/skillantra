import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Disable body parsing since we need the raw body for HMAC verification
export const runtime = 'nodejs';

export async function POST(request: Request) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('RAZORPAY_WEBHOOK_SECRET is not set');
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // 1. Read raw body for HMAC signature verification
    const rawBody = await request.text();

    // 2. Verify Razorpay webhook signature
    const razorpaySignature = request.headers.get('x-razorpay-signature');
    if (!razorpaySignature) {
        return NextResponse.json({ error: 'Missing signature header' }, { status: 400 });
    }

    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

    if (expectedSignature !== razorpaySignature) {
        console.warn('Razorpay webhook signature mismatch');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 3. Parse verified body
    let payload: any;
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const event = payload?.event;

    // 4. Handle payment.captured event — Razorpay needs 200 for all other events too
    if (event !== 'payment.captured') {
        return NextResponse.json({ received: true }, { status: 200 });
    }

    const orderId = payload?.payload?.payment?.entity?.order_id;
    if (!orderId) {
        console.error('payment.captured event missing order_id in payload');
        return NextResponse.json({ error: 'Missing order_id in payload' }, { status: 400 });
    }

    const adminSupabase = createServiceRoleClient();

    // 5. Find the application with this razorpay_order_id
    const { data: application, error: appError } = await adminSupabase
        .from('task_applications')
        .select('id, internship_id, applicant_profile_id')
        .eq('razorpay_order_id', orderId)
        .single();

    if (appError || !application) {
        console.error('Webhook: application not found for order_id:', orderId, appError?.message);
        // Still return 200 so Razorpay doesn't retry endlessly
        return NextResponse.json({ received: true }, { status: 200 });
    }

    // 6. Update application: payment_status = 'paid', status = 'hired'  (if status column exists on task_applications)
    const { error: updateError } = await adminSupabase
        .from('task_applications')
        .update({
            payment_status: 'paid',
            status: 'accepted',
        })
        .eq('id', application.id);

    if (updateError) {
        console.error('Webhook: failed to update application after payment:', updateError.message);
        // Non-fatal — payment is captured on Razorpay side, reconcile manually if needed
    }

    // 7. Fetch internship to get the recruiter (created_by profile id)
    if (application.internship_id) {
        const { data: internship, error: internshipError } = await adminSupabase
            .from('internships')
            .select('id, created_by')
            .eq('id', application.internship_id)
            .single();

        if (internshipError || !internship) {
            console.error('Webhook: internship not found for internship_id:', application.internship_id);
        } else {
            const recruiterProfileId = internship.created_by;
            const studentProfileId = application.applicant_profile_id;

            // 8. Check if a dm_conversation already exists between recruiter and student
            const { data: existingConvo } = await adminSupabase
                .from('dm_conversations')
                .select('id')
                .or(
                    `and(sender_profile_id.eq.${recruiterProfileId},receiver_profile_id.eq.${studentProfileId}),` +
                    `and(sender_profile_id.eq.${studentProfileId},receiver_profile_id.eq.${recruiterProfileId})`
                )
                .maybeSingle();

            if (!existingConvo) {
                // 9. Create a new conversation between recruiter and student
                const { error: convoError } = await adminSupabase
                    .from('dm_conversations')
                    .insert({
                        sender_profile_id: recruiterProfileId,
                        receiver_profile_id: studentProfileId,
                        status: 'accepted',
                        unread_count_sender: 0,
                        unread_count_receiver: 1,
                        last_message_at: new Date().toISOString(),
                    });

                if (convoError) {
                    console.error('Webhook: failed to create conversation after hire:', convoError.message);
                }
            }
        }
    }

    return NextResponse.json({ received: true }, { status: 200 });
}
