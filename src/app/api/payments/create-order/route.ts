import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { enforceEmailConfirmed } from '@/lib/api-helpers';

export async function POST(request: Request) {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Enforce email confirmation
    const emailCheck = await enforceEmailConfirmed(user, user.id);
    if (emailCheck) return emailCheck;

    // 3. Parse request body
    let internship_id: string;
    let applicant_id: string;
    try {
        const body = await request.json();
        internship_id = body.internship_id;
        applicant_id = body.applicant_id;
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!internship_id || typeof internship_id !== 'string') {
        return NextResponse.json({ error: 'internship_id is required' }, { status: 400 });
    }
    if (!applicant_id || typeof applicant_id !== 'string') {
        return NextResponse.json({ error: 'applicant_id is required' }, { status: 400 });
    }

    // 4. Verify Razorpay env vars
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        console.error('Missing Razorpay environment variables: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET');
        return NextResponse.json({ error: 'Payment service is not configured on the server.' }, { status: 500 });
    }

    // 5. Fetch internship to get stipend_amount
    const { data: internship, error: internshipError } = await supabase
        .from('internships')
        .select('id, stipend_amount, status')
        .eq('id', internship_id)
        .single();

    if (internshipError || !internship) {
        return NextResponse.json({ error: 'Internship not found' }, { status: 404 });
    }

    if (internship.status !== 'open') {
        return NextResponse.json({ error: 'This internship is no longer accepting applications' }, { status: 400 });
    }

    // 6. Calculate platform fee: 8% of monthly stipend
    const platformFee = Math.round(internship.stipend_amount * 0.08);
    const amountInPaise = platformFee * 100;

    // 7. Create Razorpay order
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    let order: any;
    try {
        order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `hire_${internship_id}_${applicant_id}`.slice(0, 40), // Razorpay max 40 chars
            notes: {
                internship_id,
                applicant_id,
            },
        });
    } catch (err: any) {
        console.error('Razorpay order creation failed:', err?.error || err?.message || err);
        return NextResponse.json(
            { error: 'Failed to create payment order. Please try again.' },
            { status: 502 }
        );
    }

    // 8. Save razorpay_order_id to the application row using service role client
    const adminSupabase = createServiceRoleClient();
    const { error: updateError } = await adminSupabase
        .from('task_applications')
        .update({ razorpay_order_id: order.id })
        .eq('internship_id', internship_id)
        .eq('applicant_profile_id', applicant_id);

    if (updateError) {
        console.error('Failed to save razorpay_order_id to application:', updateError.message);
        // Non-fatal: still return order so payment can proceed, we'll reconcile via webhook
    }

    // 9. Return order details to client
    return NextResponse.json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: keyId,
    });
}
