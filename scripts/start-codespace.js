const { spawn, spawnSync } = require('node:child_process');

const isWindows = process.platform === 'win32';
const pnpm = isWindows ? 'pnpm.cmd' : 'pnpm';

function run(name, args, env = {}) {
  const result = spawnSync(pnpm, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
    },
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  console.log(`[${name}] done`);
}

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

  return child;
}

console.log('Starting AI Arbitrage Codespaces server...');
console.log('Customer frontend: http://localhost:3000/');
console.log('Admin backend UI:  http://localhost:3000/admin');
console.log('API health:        http://localhost:3000/api/v1/health');
console.log('');

run('web:build', ['--filter', '@twodays/web', 'build']);

const api = start('api:3000', ['--filter', '@twodays/api', 'dev'], { API_PORT: '3000' });

function shutdown() {
  api.kill('SIGTERM');
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
