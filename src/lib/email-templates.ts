/**
 * Email templates for the internship system
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ─── Wrapper ──────────────────────────────────────────────────────────────────

function wrapHtml(content: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a2e;background:#f8f9fa;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    ${content}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="color:#888;font-size:12px;">Best,<br>The Skillantra Team</p>
  </div>
</body>
</html>`.trim();
}

function btn(label: string, href: string, color = '#2563eb'): string {
    return `<a href="${href}" style="display:inline-block;padding:12px 28px;background:${color};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:8px 4px;">${label}</a>`;
}

// ─── Student: Acceptance ──────────────────────────────────────────────────────

export function acceptanceEmail(studentName: string, internshipTitle: string, companyName: string, recruiterName: string) {
    return {
        subject: `Congratulations! You've been selected for ${internshipTitle} at ${companyName}`,
        html: wrapHtml(`
      <h2 style="color:#16a34a;">🎉 Congratulations, ${studentName}!</h2>
      <p>We're pleased to inform you that your application for <strong>${internshipTitle}</strong> at <strong>${companyName}</strong> has been accepted.</p>
      <p>The recruiter will be in touch shortly with further details and your offer letter.</p>
      <p>You can also message ${recruiterName} directly on Skillantra.</p>
      ${btn('View My Applications', `${APP_URL}/applications`)}
    `),
    };
}

// ─── Student: Rejection ───────────────────────────────────────────────────────

export function rejectionEmail(studentName: string, internshipTitle: string, companyName: string) {
    return {
        subject: `Update on your application to ${companyName}`,
        html: wrapHtml(`
      <h2>Hi ${studentName},</h2>
      <p>Thank you for your interest in the <strong>${internshipTitle}</strong> position at <strong>${companyName}</strong>.</p>
      <p>After careful consideration, the recruiter has decided to move forward with other candidates at this time. We encourage you to keep applying — new opportunities are posted regularly on Skillantra.</p>
      ${btn('Browse Internships', `${APP_URL}/internships`)}
    `),
    };
}

// ─── Student: Offer Letter Ready ──────────────────────────────────────────────

export function offerLetterEmail(studentName: string, companyName: string) {
    return {
        subject: `Your offer letter from ${companyName} is ready`,
        html: wrapHtml(`
      <h2>Hi ${studentName},</h2>
      <p>Great news! Your offer letter from <strong>${companyName}</strong> has been uploaded and is ready for you to view.</p>
      ${btn('View Offer Letter', `${APP_URL}/applications`)}
    `),
    };
}

// ─── Recruiter: Offer Letter Reminder ─────────────────────────────────────────

export function offerLetterReminderEmail(recruiterName: string, studentName: string, internshipTitle: string, internshipId: string) {
    return {
        subject: `Reminder: Upload offer letter for ${studentName}`,
        html: wrapHtml(`
      <h2>Hi ${recruiterName},</h2>
      <p>You accepted <strong>${studentName}</strong>'s application for <strong>${internshipTitle}</strong>. Please remember to upload their offer letter so it appears on their Skillantra profile.</p>
      ${btn('Upload Offer Letter →', `${APP_URL}/internships/${internshipId}/applicants`)}
    `),
    };
}

// ─── Recruiter: New Application ───────────────────────────────────────────────

export function newApplicationEmail(recruiterName: string, studentName: string, internshipTitle: string, internshipId: string) {
    return {
        subject: `New application for ${internshipTitle} from ${studentName}`,
        html: wrapHtml(`
      <h2>Hi ${recruiterName},</h2>
      <p><strong>${studentName}</strong> has applied for your internship listing: <strong>${internshipTitle}</strong>.</p>
      ${btn('View Applicants', `${APP_URL}/internships/${internshipId}/applicants`)}
    `),
    };
}

// ─── Admin: Approval Request ──────────────────────────────────────────────────

export function adminApprovalEmail(
    recruiterName: string, companyName: string, recruiterEmail: string, recruiterPhone: string | null,
    internshipId: string, title: string, aboutInternship: string, skills: string[],
    stipendMin: number, stipendMax: number, isUnpaid: boolean, applyBy: string | null,
    location: string, durationMonths: number,
    approveToken: string, rejectToken: string,
) {
    const stipendDisplay = isUnpaid ? 'Unpaid' : `₹${stipendMin.toLocaleString()} – ₹${stipendMax.toLocaleString()}/month`;
    return {
        subject: `New internship listing pending approval — ${companyName}`,
        html: wrapHtml(`
      <h2>🔔 New Internship Pending Approval</h2>
      <p>A new recruiter has submitted their first internship listing for review.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:6px 12px;color:#666;">Recruiter</td><td style="padding:6px 12px;font-weight:600;">${recruiterName}</td></tr>
        <tr><td style="padding:6px 12px;color:#666;">Company</td><td style="padding:6px 12px;">${companyName}</td></tr>
        <tr><td style="padding:6px 12px;color:#666;">Email</td><td style="padding:6px 12px;">${recruiterEmail}</td></tr>
        <tr><td style="padding:6px 12px;color:#666;">Phone</td><td style="padding:6px 12px;">${recruiterPhone || 'N/A'}</td></tr>
        <tr><td style="padding:6px 12px;color:#666;">Listing</td><td style="padding:6px 12px;font-weight:600;">${title}</td></tr>
        <tr><td style="padding:6px 12px;color:#666;">Location</td><td style="padding:6px 12px;">${location}</td></tr>
        <tr><td style="padding:6px 12px;color:#666;">Duration</td><td style="padding:6px 12px;">${durationMonths} month(s)</td></tr>
        <tr><td style="padding:6px 12px;color:#666;">Stipend</td><td style="padding:6px 12px;">${stipendDisplay}</td></tr>
        <tr><td style="padding:6px 12px;color:#666;">Skills</td><td style="padding:6px 12px;">${skills.join(', ') || 'None specified'}</td></tr>
        <tr><td style="padding:6px 12px;color:#666;">Deadline</td><td style="padding:6px 12px;">${applyBy || 'No deadline'}</td></tr>
      </table>
      <p><strong>About the internship:</strong></p>
      <p style="background:#f1f5f9;padding:12px;border-radius:8px;font-size:14px;">${(aboutInternship || '').substring(0, 500)}${(aboutInternship || '').length > 500 ? '…' : ''}</p>
      <div style="text-align:center;margin:24px 0;">
        ${btn('✅ Approve', `${APP_URL}/api/admin/internships/${internshipId}/approve?token=${approveToken}`, '#16a34a')}
        ${btn('❌ Reject', `${APP_URL}/api/admin/internships/${internshipId}/reject?token=${rejectToken}`, '#dc2626')}
      </div>
    `),
    };
}

// ─── Recruiter: Approved ──────────────────────────────────────────────────────

export function internshipApprovedEmail(recruiterName: string, title: string, internshipId: string) {
    return {
        subject: `Your internship listing is now live on Skillantra!`,
        html: wrapHtml(`
      <h2>🎉 Great news, ${recruiterName}!</h2>
      <p>Your internship listing "<strong>${title}</strong>" has been approved and is now visible to all students on Skillantra.</p>
      ${btn('View Your Listing →', `${APP_URL}/internships/${internshipId}`)}
    `),
    };
}

// ─── Recruiter: Rejected ─────────────────────────────────────────────────────

export function internshipRejectedEmail(recruiterName: string, title: string, reason?: string) {
    return {
        subject: `Update on your internship listing — ${title}`,
        html: wrapHtml(`
      <h2>Hi ${recruiterName},</h2>
      <p>Unfortunately, your internship listing "<strong>${title}</strong>" was not approved at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : '<p>If you have questions, please contact our support team.</p>'}
      <p>You may update your listing and resubmit it for review.</p>
      ${btn('Edit Listing', `${APP_URL}/internships/mine`)}
    `),
    };
}
