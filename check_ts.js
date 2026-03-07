const { execSync } = require('child_process');
try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('No TS errors');
} catch (err) {
    require('fs').writeFileSync('ts_errors.log', err.stdout ? err.stdout.toString('utf8') : err.message);
    console.log('TS errors written to ts_errors.log');
}
