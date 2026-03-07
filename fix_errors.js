const fs = require('fs');

function fixAuthForm() {
    const p = 'c:/Users/drsac/Downloads/skillantra-main/skillantra - modify - Copy/src/components/AuthForm.tsx';
    let c = fs.readFileSync(p, 'utf8');

    // Fix 1
    c = c.replace(/parseError\s+showToast\('Something went wrong. Please try again.', 'error'\);\s+\}\);\s+setError\(responseText/g, `parseError
            });
            showToast('Something went wrong. Please try again.', 'error');
            setError(responseText`);

    // Fix 2
    c = c.replace(/setError\(err.message\);\s+showToast\('Something went wrong. Please try again.', 'error'\);\s+\}\s+else\s+if\s+\(err\s+instanceof\s+TypeError/g, `setError(err.message);
        showToast('Something went wrong. Please try again.', 'error');
      } else if (err instanceof TypeError`);

    // Fix 3
    c = c.replace(/setResending\(false\);\s+showToast\('Something went wrong. Please try again.', 'error'\);\s+\}\s+finally/g, `setResending(false);
      showToast('Something went wrong. Please try again.', 'error');
    } finally`);

    fs.writeFileSync(p, c, 'utf8');
    console.log('Fixed AuthForm.tsx');
}

function fixNotifications() {
    const p = 'c:/Users/drsac/Downloads/skillantra-main/skillantra - modify - Copy/src/lib/notifications.ts';
    let c = fs.readFileSync(p, 'utf8');

    // Fix 1
    c = c.replace(/console.error\('createNotification error:', err\);\s+showToast\('Something went wrong. Please try again.', 'error'\);\s+\}/g, `console.error('createNotification error:', err);
        showToast('Something went wrong. Please try again.', 'error');
    }`);

    // Fix 2
    c = c.replace(/return \{ success: false, error: err\s+showToast\('Something went wrong. Please try again.', 'error'\);\s+\};\s+\}/g, `showToast('Something went wrong. Please try again.', 'error');
        return { success: false, error: err };
    }`);

    fs.writeFileSync(p, c, 'utf8');
    console.log('Fixed notifications.ts');
}

fixAuthForm();
fixNotifications();
