import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enforceEmailConfirmed } from '@/lib/api-helpers';

// ─── PATCH /api/internship-applications/[id] — withdraw ─────────────────────

export async function PATCH(
    request: Request,
  { params }: any
) {

    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!userProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    // Verify ownership and status
    const { data: application } = await supabase
        .from('internship_applications')
        .select('id, student_id, status')
        .eq('id', id)
        .single();

    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    if (application.student_id !== userProfile.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (application.status !== 'pending') {
        return NextResponse.json({ error: 'Only pending applications can be withdrawn' }, { status: 400 });
    }

    const { data: updated, error } = await supabase
        .from('internship_applications')
        .update({ status: 'withdrawn' })
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data: updated });
}
