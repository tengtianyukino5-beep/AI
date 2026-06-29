const { spawn } = require('node:child_process');

const isWindows = process.platform === 'win32';
const pnpm = isWindows ? 'pnpm.cmd' : 'pnpm';

const processes = [];

function start(name, args, env = {}) {
  const child = spawn(pnpm, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
    },
    stdio: 'pipe',
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`);
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });

  processes.push(child);
  return child;
}

console.log('Starting AI Arbitrage Codespaces server...');
console.log('Customer frontend: http://localhost:3000/');
console.log('Admin backend UI:  http://localhost:3000/admin');
console.log('API health:        http://localhost:3001/api/v1/health');
console.log('');

start('api:3001', ['--filter', '@twodays/api', 'dev'], { API_PORT: '3001' });
start('web:3000', ['--filter', '@twodays/web', 'exec', 'vite', '--host', '0.0.0.0', '--port', '3000', '--strictPort']);

function shutdown() {
  for (const child of processes) {
    child.kill('SIGTERM');
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
