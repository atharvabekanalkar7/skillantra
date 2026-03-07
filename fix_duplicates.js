const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function fixInjectedBlocks() {
    const dir = 'c:/Users/drsac/Downloads/skillantra-main/skillantra - modify - Copy/src';

    function walk(currentDir) {
        const files = fs.readdirSync(currentDir);
        for (const file of files) {
            const fullPath = path.join(currentDir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                walk(fullPath);
            } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let write = false;

                // Fix Duplicate supabase and user in API routes
                // The injected block looks like:
                // const supabase = await createClient();
                // const { data: { user }, error: __authError } = await supabase.auth.getUser();
                // if (!user || __authError) { ...

                if (content.includes('error: __authError')) {
                    content = content.replace(/const supabase = await createClient\(\);\s*const \{ data: \{ user \}, error: __authError \} = await supabase\.auth\.getUser\(\);/g,
                        'const __supabase = await createClient();\n  const { data: { user: __user }, error: __authError } = await __supabase.auth.getUser();');

                    content = content.replace(/!user \|\| __authError/g, '!__user || __authError');

                    write = true;
                }

                // Sometimes the injected block is just:
                // const { data: { user }, error: __authError } = await supabase.auth.getUser();
                if (content.includes('const { data: { user }, error: __authError } = await supabase.auth.getUser();')) {
                    content = content.replace(/const \{ data: \{ user \}, error: __authError \} = await supabase\.auth\.getUser\(\);/g,
                        'const { data: { user: __user }, error: __authError } = await supabase.auth.getUser();');
                    write = true;
                }

                // Fix Duplicate isDemo
                // The injected block looks like:
                // const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');
                // Let's replace it with:
                // const __isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');
                if (content.includes('const isDemo = typeof window !== \'undefined\'')) {
                    content = content.replace(/const isDemo = typeof window !== 'undefined' && window\.location\.search\.includes\('demo=true'\);/g,
                        'const __isDemo = typeof window !== \'undefined\' && window.location.search.includes(\'demo=true\');');

                    content = content.replace(/if \(isDemo\) {/g, 'if (__isDemo) {');
                    write = true;
                }

                // Fix duplicate router
                if (content.includes('const router = useRouter();') && content.indexOf('const router = useRouter();') !== content.lastIndexOf('const router = useRouter();')) {
                    // just remove the second occurrence
                    const parts = content.split('const router = useRouter();');
                    if (parts.length > 2) {
                        content = parts[0] + 'const router = useRouter();' + parts.slice(1).join('').replace(/const router = useRouter\(\);/g, '');
                        write = true;
                    }
                }

                // Fix Cannot find module '@/lib/utils/toast'
                // Just remove the import if it exists
                if (content.includes('import { showToast } from \'@/lib/utils/toast\';')) {
                    content = content.replace(/import \{ showToast \} from '@\/lib\/utils\/toast';\n?/g, '');
                    write = true;
                }

                // Fix Cannot find name 'guardAction'
                // They wrappped forms with onSubmit={guardAction(handleSubmit)}
                // If guardAction is missing, we replace it with onSubmit={handleSubmit}
                // Wait, some files might just be missing the useDemoGuard import.
                if (content.includes('guardAction(') && !content.includes('useDemoGuard')) {
                    content = content.replace(/guardAction\(([^)]+)\)/g, '$1');
                    write = true;
                }

                // Fix missing useDemoGuard import
                if (content.includes('import { useDemoGuard } from \'@/lib/utils/useDemoGuard\';')) {
                    content = content.replace(/import \{ useDemoGuard \} from '@\/lib\/utils\/useDemoGuard';\n?/g, '');
                    write = true;
                }
                if (content.includes('const { guardAction } = useDemoGuard();')) {
                    content = content.replace(/const \{ guardAction \} = useDemoGuard\(\);\n?/g, '');
                    content = content.replace(/guardAction\(([^)]+)\)/g, '$1');
                    write = true;
                }

                if (write) {
                    fs.writeFileSync(fullPath, content, 'utf8');
                }
            }
        }
    }

    walk(dir);
    console.log('Fixed block scope and import issues');
}

fixInjectedBlocks();
