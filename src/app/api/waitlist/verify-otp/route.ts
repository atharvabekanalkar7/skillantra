import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Check against waitlist_otps table
    const { data: record, error: supabaseError } = await supabase
      .from('waitlist_otps')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (supabaseError) {
      console.error('Supabase OTP verification error:', supabaseError);
      return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    // Mark as verified in the same record or just return success
    // The waitlist table has verified_email, so we'll set that true later.
    return NextResponse.json({ verified: true });
  } catch (error: any) {
    console.error('Waitlist verify-otp error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
