import { createServiceRoleClient } from '@/lib/supabase/server';
import { showToast } from '@/lib/utils/toast';

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
    if (!process.env.RESEND_API_KEY) {
        console.log(`📧 EMAIL (no API key):\n  To: ${to}\n  Subject: ${subject}`)
        return { success: true }
    }

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'SkillAntra <onboarding@resend.dev>',
                to,
                subject,
                html: htmlBody
            })
        })

        if (!res.ok) {
            const err = await res.json()
            console.error('Resend error:', err)
            return { success: false, error: err }
        }

        console.log(`📧 EMAIL SENT via Resend to: ${to}`)
        return { success: true }
    } catch (err) {
        console.error('sendEmail error:', err)
        return { success: false, error: err }
    }
}

// ─── WhatsApp (PLACEHOLDER) ──────────────────────────────────────────────────

export async function sendWhatsApp(phone: string, message: string) {
    console.log(`📱 WHATSAPP (placeholder):\n  To: ${phone}\n  Message: ${message}`);
    return { success: true, placeholder: true };
}
