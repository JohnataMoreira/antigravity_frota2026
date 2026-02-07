const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Frota2026 API...\n');

const apiProcess = spawn('npx', ['nodemon', '--watch', 'src', '--ext', 'ts', '--exec', 'ts-node', '-r', 'tsconfig-paths/register', 'src/main.ts'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
});

apiProcess.on('error', (error) => {
    console.error(`Error: ${error.message}`);
});

apiProcess.on('close', (code) => {
    console.log(`API process exited with code ${code}`);
});
