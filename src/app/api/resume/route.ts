import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// ─── GET /api/resume — get student's Skillantra resume ──────────────────────

export async function GET(request: Request) {
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

    const { data: resume, error } = await supabase
        .from('skillantra_resumes')
        .select('*')
        .eq('student_id', userProfile.id)
        .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data: resume });
}

// ─── POST /api/resume — create resume ───────────────────────────────────────

export async function POST(request: Request) {
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

    try {
        const body = await request.json();
        const resumeData = {
            student_id: userProfile.id,
            career_objective: body.career_objective || null,
            education: body.education || [],
            work_experience: body.work_experience || [],
            extra_curricular: body.extra_curricular || [],
            trainings_courses: body.trainings_courses || [],
            academic_projects: body.academic_projects || [],
            skills: body.skills || [],
            portfolio_links: body.portfolio_links || [],
            accomplishments: body.accomplishments || null,
            updated_at: new Date().toISOString(),
        };

        // Upsert — insert or update
        const { data: existing } = await supabase
            .from('skillantra_resumes')
            .select('id')
            .eq('student_id', userProfile.id)
            .maybeSingle();

        let result;
        if (existing) {
            const { data, error } = await supabase
                .from('skillantra_resumes')
                .update(resumeData)
                .eq('id', existing.id)
                .select()
                .single();
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            result = data;
        } else {
            const { data, error } = await supabase
                .from('skillantra_resumes')
                .insert(resumeData)
                .select()
                .single();
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            result = data;
        }

        return NextResponse.json({ data: result });
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}

// ─── PATCH /api/resume — update resume ──────────────────────────────────────

export async function PATCH(request: Request) {
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

    try {
        const body = await request.json();
        const allowedFields = [
            'career_objective', 'education', 'work_experience', 'extra_curricular',
            'trainings_courses', 'academic_projects', 'skills', 'portfolio_links', 'accomplishments',
        ];

        const updates: Record<string, any> = { updated_at: new Date().toISOString() };
        for (const key of allowedFields) {
            if (body[key] !== undefined) updates[key] = body[key];
        }

        const { data: resume, error } = await supabase
            .from('skillantra_resumes')
            .update(updates)
            .eq('student_id', userProfile.id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ data: resume });
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
