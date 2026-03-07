import { showToast } from '@/lib/utils/toast';
/**
 * Notification utilities — in-app, email, and WhatsApp (placeholder)
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

// ─── In-App Notification ──────────────────────────────────────────────────────

export async function createNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    metadata: Record<string, any> = {}
) {
    try {
        const supabase = createServiceRoleClient();
        const { error } = await supabase.from('notifications').insert({
            user_id: userId,
            type,
            title,
            body,
            metadata,
        });
        if (error) console.error('Failed to create notification:', error.message);
    } catch (err) {
        console.error('createNotification error:', err);
        showToast('Something went wrong. Please try again.', 'error');
    }
}

// ─── Email ────────────────────────────────────────────────────────────────────

export async function sendEmail(to: string, subject: string, htmlBody: string) {
    try {
        // Use Supabase Edge Function or direct SMTP
        // For MVP, we'll use the Supabase auth.admin API to send a magic link-style email
        // In production, integrate Resend or similar
        const supabase = createServiceRoleClient();

        // Try using Supabase's built-in email (via auth.admin.inviteUserByEmail as a workaround)
        // For a proper implementation, integrate Resend:
        // const res = await fetch('https://api.resend.com/emails', {
        //   method: 'POST',
        //   headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ from: 'Skillantra <noreply@skillantra.in>', to, subject, html: htmlBody }),
        // });

        console.log(`📧 EMAIL SENT (simulated):\n  To: ${to}\n  Subject: ${subject}\n  Body length: ${htmlBody.length} chars`);

        // TODO: Replace with actual email provider (Resend, SendGrid, etc.)
        // For now, log to console so the flow works end-to-end
        return { success: true };
    } catch (err) {
        console.error('sendEmail error:', err);
        showToast('Something went wrong. Please try again.', 'error');
        return { success: false, error: err };
    }
}

// ─── WhatsApp (PLACEHOLDER) ──────────────────────────────────────────────────

export async function sendWhatsApp(phone: string, message: string) {
    // TODO: Integrate WhatsApp Business API (Twilio, Meta Cloud API, etc.)
    console.log(`📱 WHATSAPP (placeholder):\n  To: ${phone}\n  Message: ${message}`);
    return { success: true, placeholder: true };
}
