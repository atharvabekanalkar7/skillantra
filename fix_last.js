const fs = require('fs');

function fixFiles() {
    const f1 = 'c:/Users/drsac/Downloads/skillantra-main/skillantra - modify - Copy/src/app/api/internship-applications/route.ts';
    let c1 = fs.readFileSync(f1, 'utf8');
    c1 = c1.replace(/const __supabase = await createClient\(\);\s*const \{ data: \{ user: __user \}, error: __authError \} = await __supabase\.auth\.getUser\(\);\s*if \(!__user \|\| __authError\) \{\s*return NextResponse\.json\(\{ error: 'Authentication required' \}, \{ status: 401 \}\);\s*\}/g, 'const supabase = await createClient();');
    // It says Cannot find name 'supabase'. Did you mean '__supabase'? So we just rename __supabase back if it's there
    c1 = c1.replace(/__supabase/g, 'supabase');
    c1 = c1.replace(/__user/g, 'user');
    c1 = c1.replace(/__authError/g, 'authError');
    fs.writeFileSync(f1, c1, 'utf8');

    const f2 = 'c:/Users/drsac/Downloads/skillantra-main/skillantra - modify - Copy/src/app/api/notifications/mark-read/route.ts';
    let c2 = fs.readFileSync(f2, 'utf8');
    c2 = c2.replace(/const __supabase = await createClient\(\);[\s\S]*?status: 401 \}\);\s*\}/g, 'const supabase = await createClient();');
    // Just in case it's missing supabase entirely:
    if (!c2.includes('const supabase = await createClient();')) {
        c2 = c2.replace(/export async function (POST|GET|PATCH)\(request: Request\) \{/, 'export async function $1(request: Request) {\n    const supabase = await createClient();');
    }
    fs.writeFileSync(f2, c2, 'utf8');

    const f3 = 'c:/Users/drsac/Downloads/skillantra-main/skillantra - modify - Copy/src/app/api/resume/route.ts';
    let c3 = fs.readFileSync(f3, 'utf8');
    c3 = c3.replace(/const __supabase = await createClient\(\);[\s\S]*?status: 401 \}\);\s*\}/g, 'const supabase = await createClient();');
    fs.writeFileSync(f3, c3, 'utf8');

    const f4 = 'c:/Users/drsac/Downloads/skillantra-main/skillantra - modify - Copy/src/lib/notifications.ts';
    let c4 = fs.readFileSync(f4, 'utf8');
    if (!c4.includes('import { showToast }')) {
        c4 = "import { showToast } from '@/lib/utils/toast';\n" + c4;
    }
    fs.writeFileSync(f4, c4, 'utf8');
}
fixFiles();
