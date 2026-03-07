const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;

            // 1. Remove duplicate imports or injected block for 'const createClient ='
            if (content.match(/const \{ createClient \} = await import\('@\/lib\/supabase\/server'\)\.catch\(\(\) => \(\{ createClient: null \}\)\);/)) {
                content = content.replace(/\s*\/\/\s*Import added manually by Demo script[\s\S]*?if \(!__user \|\| __authError\) \{\s*return NextResponse\.json\(\{ error: 'Authentication required' \}, \{ status: 401 \}\);\s*\}\s*\}/g, '');
                changed = true;
            }

            // 2. Remove injected block 'const supabase = await createClient(); const { data: { user } ...' IF another 'const supabase = await createClient()' exists or is below
            if (content.match(/const supabase = await createClient\(\);\s*const \{ data: \{ user \}, error: __authError \} = await supabase\.auth\.getUser\(\);\s*if \(!user \|\| __authError\) \{\s*return NextResponse\.json\(\{ error: 'Authentication required' \}, \{ status: 401 \}\);\s*\}/)) {
                content = content.replace(/const supabase = await createClient\(\);\s*const \{ data: \{ user \}, error: __authError \} = await supabase\.auth\.getUser\(\);\s*if \(!user \|\| __authError\) \{\s*return NextResponse\.json\(\{ error: 'Authentication required' \}, \{ status: 401 \}\);\s*\}/g, '');
                changed = true;
            }

            // 3. Remove injected 'const { data: { user }, error: __authError } ...' if it creates redeclarations
            // Since it's easier to just strip these duplicates directly based on patterns:
            if (content.match(/const \{ data: \{ user \}, error: __authError \} = await supabase\.auth\.getUser\(\);\s*if \(!user \|\| __authError\) \{\s*return NextResponse\.json\(\{ error: 'Authentication required' \}, \{ status: 401 \}\);\s*\}/)) {
                content = content.replace(/const \{ data: \{ user \}, error: __authError \} = await supabase\.auth\.getUser\(\);\s*if \(!user \|\| __authError\) \{\s*return NextResponse\.json\(\{ error: 'Authentication required' \}, \{ status: 401 \}\);\s*\}/g, '');
                changed = true;
            }

            // Fix `isDemo` redeclarations
            const isDemoDecl = /const isDemo = typeof window !== 'undefined'[^;]+;/g;
            const m = content.match(isDemoDecl);
            if (m && m.length > 1) {
                let count = 0;
                content = content.replace(isDemoDecl, (b) => {
                    count++;
                    return count === 1 ? b : '';
                });
                changed = true;
            }

            // Fix `router` redeclarations
            const routerDecl = /const router = useRouter\(\);/g;
            const rm = content.match(routerDecl);
            if (rm && rm.length > 1) {
                let count = 0;
                content = content.replace(routerDecl, (b) => {
                    count++;
                    return count === 1 ? b : '';
                });
                changed = true;
            }

            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

processDir('c:/Users/drsac/Downloads/skillantra-main/skillantra - modify - Copy/src/app');
