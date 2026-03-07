import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enforceEmailConfirmed } from '@/lib/api-helpers';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emailCheck = await enforceEmailConfirmed(user, user.id);
    if (emailCheck) return emailCheck;

    const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (profileError || !userProfile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const mine = searchParams.get('mine') === 'true';

    let query = supabase
        .from('internships')
        .select('*')
        .order('created_at', { ascending: false });

    if (mine) {
        query = query.eq('created_by', userProfile.id) as typeof query;
    } else {
        query = query.eq('status', 'open').neq('created_by', userProfile.id) as typeof query;
    }

    const { data: internships, error } = await query;
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Attach applicant counts
    if (mine && internships && internships.length > 0) {
        const ids = internships.map((i: any) => i.id);
        const { data: counts } = await supabase
            .from('task_applications')
            .select('internship_id')
            .in('internship_id', ids);

        const countMap: Record<string, number> = {};
        (counts || []).forEach((row: any) => {
            countMap[row.internship_id] = (countMap[row.internship_id] || 0) + 1;
        });

        const enriched = internships.map((i: any) => ({ ...i, applicant_count: countMap[i.id] ?? 0 }));
        return NextResponse.json({ internships: enriched });
    }

    return NextResponse.json({ internships: internships || [] });
}

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
    if (emailCheck) {
        return emailCheck;
    }

    // 3. Get profile & verify recruiter status
    const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_type, is_verified, company_name, company_logo_url')
        .eq('user_id', user.id)
        .single();

    if (profileError || !userProfile) {
        return NextResponse.json({ error: 'Profile not found. Please create your profile first.' }, { status: 404 });
    }

    if (userProfile.user_type !== 'recruiter') {
        return NextResponse.json({ error: 'Only recruiters can post internships.' }, { status: 403 });
    }

    if (!userProfile.is_verified) {
        return NextResponse.json({ error: 'Your recruiter account is pending verification.' }, { status: 403 });
    }

    if (!userProfile.company_name) {
        return NextResponse.json({ error: 'Company name is required. Please complete your recruiter profile.' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const {
            role_title,
            description,
            skills_required,
            duration_weeks,
            stipend_amount,
            work_mode,
            apply_by_date,
            seats,
        } = body;

        // ---- Basic Validation ----
        if (!role_title || typeof role_title !== 'string' || role_title.trim().length === 0) {
            return NextResponse.json({ error: 'Role title is required' }, { status: 400 });
        }

        if (!description || typeof description !== 'string' || description.trim().length === 0) {
            return NextResponse.json({ error: 'Description is required' }, { status: 400 });
        }

        if (!duration_weeks || typeof duration_weeks !== 'number' || duration_weeks <= 0) {
            return NextResponse.json({ error: 'Valid duration in weeks is required' }, { status: 400 });
        }

        if (stipend_amount === undefined || stipend_amount === null || typeof stipend_amount !== 'number' || stipend_amount < 0) {
            return NextResponse.json({ error: 'Monthly stipend is required and must be a non-negative number' }, { status: 400 });
        }

        if (mode_mapped(work_mode) === null) {
            return NextResponse.json({ error: 'Work mode must be Remote, Hybrid, or On-site' }, { status: 400 });
        }

        if (seats && (typeof seats !== 'number' || seats < 1 || seats > 10)) {
            return NextResponse.json({ error: 'Seats must be between 1 and 10' }, { status: 400 });
        }

        if (apply_by_date) {
            const deadlineDate = new Date(apply_by_date);
            if (isNaN(deadlineDate.getTime())) {
                return NextResponse.json({ error: 'Invalid apply-by date format' }, { status: 400 });
            }
            if (deadlineDate.getTime() <= Date.now()) {
                return NextResponse.json({ error: 'Apply-by date must be in the future' }, { status: 400 });
            }
        }

        let parsedSkills: string[] = [];
        if (skills_required && Array.isArray(skills_required)) {
            parsedSkills = skills_required.filter(s => typeof s === 'string' && s.trim().length > 0).map(s => s.trim());
        }

        // ---- Build insert data ----
        const internshipData = {
            created_by: userProfile.id,
            company_name: userProfile.company_name,
            company_logo_url: userProfile.company_logo_url || null,
            role_title: role_title.trim(),
            description: description.trim(),
            skills_required: parsedSkills,
            duration_weeks: duration_weeks,
            stipend_amount: stipend_amount,
            work_mode: mode_mapped(work_mode),
            apply_by_date: apply_by_date || null,
            seats: seats || 1,
            status: 'open',
        };

        const { data: newInternship, error: insertError } = await supabase
            .from('internships')
            .insert(internshipData)
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting internship:', insertError);
            return NextResponse.json({ error: insertError.message || 'Failed to create internship' }, { status: 500 });
        }

        return NextResponse.json({ internship: newInternship }, { status: 201 });
    } catch (err: any) {
        console.error('Internship creation failed:', err);
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}

function mode_mapped(frontendMode: string): string | null {
    const mode = frontendMode?.toLowerCase() || '';
    if (['remote', 'hybrid'].includes(mode)) return mode;
    if (mode === 'on-site' || mode === 'onsite' || mode === 'in-person') return 'onsite';
    return null;
}
