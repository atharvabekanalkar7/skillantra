import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Opt out of caching for this route (ensure it truly runs every time Vercel Cron executes it)
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // 1. Verify Authorization
    // Vercel Cron injects the secret provided in your project environment
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error('CRON_SECRET environment variable is missing.');
        return NextResponse.json(
            { error: 'Server misconfiguration: CRON_SECRET not set' },
            { status: 500 }
        );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
        console.warn('Unauthorized cron invocation attempt.');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. We explicitly use the Service Role Client to bypass Row Level Security.
        // Ensure that RLS won't block the automated system from deleting tasks it doesn't "own".
        const supabaseAdmin = createServiceRoleClient();

        // 3. Define the expiry threshold: exactly 7 days ago.
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // 4. Execute the deletion
        // Due to the Foreign Key "ON DELETE CASCADE" rules set up in the DB schema,
        // (task_applications.task_id REFERENCES tasks(id) ON DELETE CASCADE),
        // deleting a task will automatically and atomically delete all its linked applications!
        // This entirely prevents orphaned database records with zero race conditions.
        const { data: deletedTasks, error } = await supabaseAdmin
            .from('tasks')
            .delete()
            .lt('created_at', sevenDaysAgo)
            .select('id, title, created_at, creator_profile_id'); // Select deleted tasks for logging and audits

        if (error) {
            console.error('Error executing task deletion cron:', error);
            return NextResponse.json({ error: 'Failed to delete expired tasks', details: error.message }, { status: 500 });
        }

        console.log(`Cron Task Expiry cleanup completed. Deleted ${deletedTasks?.length || 0} tasks.`);

        return NextResponse.json({
            success: true,
            deleted_count: deletedTasks?.length || 0,
            deleted_tasks: deletedTasks || [], // Auditable log returned to Vercel logs
        }, { status: 200 });

    } catch (error: any) {
        console.error('Unexpected error during task cron job:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
