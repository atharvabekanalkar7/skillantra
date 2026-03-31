import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  console.log("--- OTP DEBUG START ---");
  console.log("OTP Route hit: /api/waitlist/send-otp");

  try {
    const { email } = await request.json();
    console.log("Email received:", email);

    if (!email) {
      console.error("Error: Email is missing in request");
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("OTP generated:", otp);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const supabase = createServiceRoleClient();

    // Store in waitlist_otps table
    console.log("Storing OTP in Supabase...");
    const { error: supabaseError } = await supabase.from('waitlist_otps').insert({
      email,
      otp,
      expires_at: expiresAt,
    });

    if (supabaseError) {
      console.error('Supabase OTP error:', supabaseError.message);
      return NextResponse.json({ error: 'Failed to store OTP' }, { status: 500 });
    }
    console.log("OTP stored successfully in Supabase");

    // Email Sending Logic
    const apiKey = process.env.RESEND_API_KEY;
    console.log("API Key exists:", !!apiKey);

    if (!apiKey) {
      console.warn("WARNING: RESEND_API_KEY is missing. Falling back to dev mode.");
      console.log("DEV OTP:", otp);
      console.log("--- OTP DEBUG END (SUCCESS FALLBACK) ---");
      return NextResponse.json({ success: true, devMode: true });
    }

    console.log("Sending email via Resend API...");
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Skillantra <onboarding@resend.dev>',
          to: email,
          subject: 'Your SkillAntra verification code',
          html: `Your OTP is <strong>${otp}</strong>. Valid for 10 minutes.`
        })
      });

      const data = await res.json();
      console.log("Resend response status:", res.status);
      console.log("Resend response body:", JSON.stringify(data, null, 2));

      if (!res.ok) {
        console.error("Resend delivery failed:", data.error || data);
        console.log("DEV OTP (on failure):", otp);
        
        // As per Step 6: Return success so frontend continues even if email fails
        console.log("--- OTP DEBUG END (FAILURE FALLBACK) ---");
        return NextResponse.json({ success: true, devMode: true, error: data.error });
      }

      console.log("Email sent successfully via Resend");
      console.log("--- OTP DEBUG END (SUCCESS) ---");
      return NextResponse.json({ success: true });

    } catch (emailError: any) {
      console.error("Resend fetch error:", emailError.message);
      console.log("DEV OTP (on fetch error):", otp);
      console.log("--- OTP DEBUG END (EXCEPTION FALLBACK) ---");
      return NextResponse.json({ success: true, devMode: true, error: emailError.message });
    }

  } catch (error: any) {
    console.error('Critical Waitlist send-otp error:', error.message);
    console.log("--- OTP DEBUG END (CRITICAL ERROR) ---");
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
