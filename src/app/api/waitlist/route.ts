import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const { name, email, phone, college, interests } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Use upsert on email to handle both new (legacy if any) and updates from Google Auth flow
    const { error: supabaseError } = await supabase
      .from('waitlist_users')
      .upsert({
        name,
        email,
        phone,
        college: college || 'IIT Mandi',
        interests,
        status: 'waitlisted',
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

    if (supabaseError) {
      console.error('Supabase waitlist error:', supabaseError.message);
      return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
    }

    // Get waitlist position (total count)
    const { count, error: countError } = await supabase
      .from('waitlist_users')
      .select('*', { count: 'exact', head: true });

    const position = count || 0;

    // Send confirmation email
    try {
      await sendEmail(
        email,
        "You're on the SkillAntra waitlist 🎉",
        `<p>Hey ${name},</p>
        <p>You're in. We'll notify you when SkillAntra launches at <strong>${college || 'IIT Mandi'}</strong>.</p>
        <p>Priority internship access is reserved for you.</p>
        <p>Waitlist position: #${position}</p>`
      );

      // Send admin notification
      const adminEmail = process.env.ADMIN_EMAIL || 'sanitocorleone@gmail.com';
      await sendEmail(
        adminEmail,
        `New waitlist signup — ${name} from ${college || 'IIT Mandi'}`,
        `<p>A student has completed their waitlist profile:</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Phone:</strong> ${phone || 'Not provided'}</li>
          <li><strong>College:</strong> ${college || 'IIT Mandi'}</li>
          <li><strong>Interests:</strong> ${interests?.join(', ') || 'None'}</li>
          <li><strong>Position:</strong> #${position}</li>
        </ul>`
      );
    } catch (emailErr) {
      console.error('Non-blocking email error:', emailErr);
    }

    return NextResponse.json({ success: true, position });
  } catch (error: any) {
    console.error('Waitlist submission error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
