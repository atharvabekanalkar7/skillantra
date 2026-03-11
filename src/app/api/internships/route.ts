import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enforceEmailConfirmed } from '@/lib/api-helpers';
import { adminApprovalEmail } from '@/lib/email-templates';
import { sendEmail } from '@/lib/notifications';
import crypto from 'crypto';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'atharvasachinofficial@gmail.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'fallback-secret-for-dev';

export async function GET(request: Request) {
    // Demo Mode Check
    const { searchParams } = new URL(request.url);
    const isDemo = searchParams.get('demo') === 'true' || request.headers.get('referer')?.includes('demo=true');

    if (isDemo) {
        return NextResponse.json({
            internships: [
                {
                    id: 'demo-internship-1',
                    title: 'Full Stack Developer',
                    company_name: 'TechCorp',
                    location: 'Remote',
                    duration_months: 6,
                    stipend_min: 15000,
                    stipend_max: 20000,
                    apply_by: new Date(Date.now() + 86400000 * 30).toISOString(),
                    status: 'approved',
                    applicant_count: 12
                },
                {
                    id: 'demo-internship-2',
                    title: 'UI/UX Designer',
                    company_name: 'Creative Labs',
                    location: 'Hybrid',
                    duration_months: 3,
                    stipend_min: 10000,
                    stipend_max: 12000,
                    apply_by: new Date(Date.now() + 86400000 * 15).toISOString(),
                    status: 'approved',
                    applicant_count: 8
                }
            ]
        });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_type, degree_level')
        .eq('user_id', user.id)
        .single();

    if (profileError || !userProfile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { searchParams: getSearchParams } = new URL(request.url);
    const mine = getSearchParams.get('mine') === 'true';

    let query = supabase
        .from('internships')
        .select('*')
        .order('created_at', { ascending: false });

    if (mine) {
        if (userProfile.user_type !== 'recruiter') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        query = query.eq('recruiter_id', userProfile.id) as typeof query;
    } else {
        // Students browse
        query = query.eq('status', 'approved') as typeof query;
        // Supabase apply_by >= today filter
        query = query.gte('apply_by', new Date().toISOString()) as typeof query;

        // Degree Level filtering
        if (userProfile.degree_level === 'UG') {
            query = query.in('target_degree', ['both', 'ug']) as typeof query;
        } else if (userProfile.degree_level === 'PG') {
            query = query.in('target_degree', ['both', 'pg']) as typeof query;
        }
    }

    const { data: internships, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Attach applicant counts
    if (internships && internships.length > 0) {
        const ids = internships.map((i: any) => i.id);
        const { data: counts } = await supabase
            .from('internship_applications')
            .select('internship_id')
            .in('internship_id', ids);

        const countMap: Record<string, number> = {};
        (counts || []).forEach((row: any) => {
            countMap[row.internship_id] = (countMap[row.internship_id] || 0) + 1;
        });

        const enriched = internships.map((i: any) => {
            // Also auto-expire if past apply_by (for mine view)
            if (mine && i.status === 'approved' && new Date(i.apply_by).getTime() < Date.now()) {
                i.status = 'expired';
            }
            return { ...i, applicant_count: countMap[i.id] ?? 0 };
        });
        return NextResponse.json({ internships: enriched });
    }

    return NextResponse.json({ internships: [] });
}

export async function POST(request: Request) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emailCheck = await enforceEmailConfirmed(user, user.id);
    if (emailCheck) return emailCheck;

    const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_type, is_verified, company_name, company_logo_url, name, phone_number')
        .eq('user_id', user.id)
        .single();

    if (profileError || !userProfile) {
        return NextResponse.json({ error: 'Only recruiters can post internships.' }, { status: 403 });
    }

    if (userProfile.user_type === 'student') {
        return NextResponse.json({ error: 'Only recruiters can post internships' }, { status: 403 })
    }

    if (!userProfile.is_verified) {
        return NextResponse.json({ error: 'Your recruiter account is pending verification.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const {
            title, location, start_date, duration_months,
            stipend_min, stipend_max, is_unpaid, apply_by,
            number_of_openings, about_internship, skills_required,
            who_can_apply, perks, is_linkedin_mandatory, questions, target_degree
        } = body;

        if (!title || !duration_months || !about_internship || !who_can_apply || !apply_by) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Rate limit: Max 3 internship posts per 24 hours per recruiter
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supabase
            .from('internships')
            .select('*', { count: 'exact', head: true })
            .eq('recruiter_id', userProfile.id)
            .gte('created_at', twentyFourHoursAgo);

        if ((count || 0) >= 3) {
            return NextResponse.json(
                { error: 'You can only post 3 internships per 24 hours. Please try again later.' },
                { status: 429 }
            );
        }

        // Auto-approve for verified recruiters
        const status = userProfile.is_verified === true ? 'approved' : 'pending_approval';

        // Insert internship
        const internshipData = {
            recruiter_id: userProfile.id,
            title: title.trim(),
            company_name: userProfile.company_name,
            company_logo_url: userProfile.company_logo_url || null,
            location: location,
            start_date: start_date,
            duration_months: Number(duration_months),
            stipend_min: is_unpaid ? 0 : Number(stipend_min),
            stipend_max: is_unpaid || !stipend_max ? 0 : Number(stipend_max),
            is_unpaid: !!is_unpaid,
            apply_by: apply_by,
            number_of_openings: Number(number_of_openings),
            about_internship: about_internship.trim(),
            skills_required: skills_required || [],
            who_can_apply: who_can_apply.trim(),
            perks: perks || [],
            is_linkedin_mandatory: !!is_linkedin_mandatory,
            status,
            target_degree: target_degree || 'both'
        };

        const { data: newInternship, error: insertError } = await supabase
            .from('internships')
            .insert(internshipData)
            .select()
            .single();

        if (insertError) {
            console.error('Insert Error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // Insert questions
        if (questions && questions.length > 0) {
            const qs = questions.slice(0, 5).map((q: any) => ({
                internship_id: newInternship.id,
                question_text: q.question_text,
                question_type: q.question_type,
                is_required: !!q.is_required,
                order_index: q.order_index || 0
            }));

            const { error: qError } = await supabase.from('internship_questions').insert(qs);
            if (qError) console.error('Failed to insert questions:', qError);
        }

        // Send admin email if pending_approval
        if (status === 'pending_approval') {
            const approveToken = crypto.createHmac('sha256', ADMIN_SECRET).update(newInternship.id).digest('hex');
            const rejectToken = crypto.createHmac('sha256', ADMIN_SECRET).update(newInternship.id).digest('hex');

            const emailContent = adminApprovalEmail(
                userProfile.name,
                userProfile.company_name || 'Unknown Company',
                user.email || '',
                userProfile.phone_number,
                newInternship.id,
                title,
                about_internship,
                skills_required || [],
                stipend_min,
                stipend_max,
                is_unpaid,
                apply_by,
                location,
                duration_months,
                approveToken,
                rejectToken
            );

            await sendEmail(ADMIN_EMAIL, emailContent.subject, emailContent.html);
        }

        return NextResponse.json({ internship: newInternship }, { status: 201 });
    } catch (err: any) {
        console.error('Internship POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
