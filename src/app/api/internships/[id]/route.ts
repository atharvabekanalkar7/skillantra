import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enforceEmailConfirmed } from '@/lib/api-helpers';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: internship, error } = await supabase
        .from('internships')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !internship) {
        return NextResponse.json({ error: 'Internship not found' }, { status: 404 });
    }

    return NextResponse.json({ internship });
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const emailCheck = await enforceEmailConfirmed(user, user.id);
    if (emailCheck) return emailCheck;

    const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!userProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const body = await request.json();
    const { status } = body;

    if (!status || !['open', 'closed', 'filled'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('internships')
        .update({ status })
        .eq('id', id)
        .eq('created_by', userProfile.id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
        return NextResponse.json({ error: 'Internship not found or not yours' }, { status: 404 });
    }

    return NextResponse.json({ internship: data });
}
