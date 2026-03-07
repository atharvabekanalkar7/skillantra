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

            // Type 1: The __supabase block replacement
            // Needs to be reverted to `const supabase = await createClient();`
            const badBlock1 = /const __supabase = await createClient\(\);\s*const \{ data: \{ user: __user \}, error: __authError \} = await __supabase\.auth\.getUser\(\);\s*if \(!__user \|\| __authError\) \{\s*return NextResponse\.json\(\{ error: 'Authentication required' \}, \{ status: 401 \}\);\s*\}/g;

            if (content.match(badBlock1)) {
                if (!content.includes('const supabase = await createClient();') || content.includes('const { data: { user }, error: authError } = await supabase.auth.getUser();')) {
                    // Replace with const supabase so the original code works
                    content = content.replace(badBlock1, 'const supabase = await createClient();');
                } else {
                    content = content.replace(badBlock1, '');
                }
                changed = true;
            }

            // Type 2: The createClient injected block that collides
            const badBlock2 = /\/\/ Import added manually by Demo script[\s\n]*const \{ createClient \} = await import\('@\/lib\/supabase\/server'\)\.catch\(\(\) => \(\{ createClient: null \}\)\);[\s\n]*const supabase = createClient \? await createClient\(\) : null;[\s\n]*if \(supabase\) \{[\s\n]*const \{ data: \{ user: __user \}, error: __authError \} = await supabase\.auth\.getUser\(\);[\s\n]*if \(!__user \|\| __authError\) \{[\s\n]*return NextResponse\.json\(\{ error: 'Authentication required' \}, \{ status: 401 \}\);[\s\n]*\}[\s\n]*\}/g;

            // We also check for variation where it redeclares supabase and the import is at top
            if (content.match(badBlock2)) {
                content = content.replace(badBlock2, '');
                changed = true;
            }

            const badBlock3 = /const supabase = await createClient\(\);[\s\n]+const \{ data: \{ user \}, error: __authError \} = await supabase\.auth\.getUser\(\);[\s\n]+if \(!user \|\| __authError\) \{[\s\n]+return NextResponse\.json\(\{ error: 'Authentication required' \}, \{ status: 401 \}\);[\s\n]+\}/g;
            if (content.match(badBlock3)) {
                content = content.replace(badBlock3, '');
                changed = true;
            }

            // Type 3: Redeclaration of isDemo
            // Some files have `const isDemo = ...` at the top level and in component
            const isDemoDecl = /const isDemo = typeof window !== 'undefined'[^;]+;/g;
            const matches = content.match(isDemoDecl);
            if (matches && matches.length > 1) {
                // just remove the second occurrence
                let count = 0;
                content = content.replace(isDemoDecl, (m) => {
                    count++;
                    return count === 1 ? m : ''; // keep first only
                });
                changed = true;
            }

            // Fix router redeclaration
            const routerDecl = /const router = useRouter\(\);/g;
            const rMatches = content.match(routerDecl);
            if (rMatches && rMatches.length > 1) {
                let count = 0;
                content = content.replace(routerDecl, (m) => {
                    count++;
                    return count === 1 ? m : '';
                });
                changed = true;
            }

            // Restore guardAction missing in internships/new/page.tsx etc if it was deleted
            // Actually, if guardAction is not found, we just replace it with the callback
            if (content.includes('onSubmit={guardAction(') && !content.includes('useDemoGuard')) {
                content = content.replace(/guardAction\(([^)]+)\)/g, '$1');
                changed = true;
            }

            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

// 1. Process files
processDir('c:/Users/drsac/Downloads/skillantra-main/skillantra - modify - Copy/src/app');

// 2. Create toast.ts
const toastContent = \`"use client";
export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  if (typeof window !== 'undefined') {
    // Basic fallback alert or custom div
    console.log(\`[\${type.toUpperCase()}]: \${message}\`);
    const div = document.createElement('div');
    div.innerText = message;
    div.style.position = 'fixed';
    div.style.bottom = '20px';
    div.style.right = '20px';
    div.style.padding = '12px 24px';
    div.style.borderRadius = '8px';
    div.style.color = '#fff';
    div.style.background = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6';
    div.style.zIndex = '9999';
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  }
};
\`;
fs.writeFileSync('c:/Users/drsac/Downloads/skillantra-main/skillantra - modify - Copy/src/lib/utils/toast.ts', toastContent);

// 3. Create useDemoGuard.ts
const demoGuardContent = \`"use client";
import { showToast } from './toast';

export function useDemoGuard() {
  const guardAction = <T extends (...args: any[]) => any>(action: T) => {
    return ((...args: Parameters<T>) => {
      const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');
      if (isDemo) {
        showToast('This action is disabled in demo mode', 'info');
        return;
      }
      return action(...args);
    }) as T;
  };
  return { guardAction };
}
\`;
fs.writeFileSync('c:/Users/drsac/Downloads/skillantra-main/skillantra - modify - Copy/src/lib/utils/useDemoGuard.ts', demoGuardContent);

console.log('Automated cleanup done.');
