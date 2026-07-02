const { spawnSync } = require('node:child_process');

const isWindows = process.platform === 'win32';
const pnpm = process.env.npm_execpath || (isWindows ? 'pnpm.cmd' : 'pnpm');
const configuredPort = Number(process.env.API_PORT || process.env.PORT || 8080);
const port = Number.isFinite(configuredPort) && configuredPort > 0 ? configuredPort : 8080;
const codespaceName = process.env.CODESPACE_NAME;
const forwardingDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
const externalBaseUrl =
  codespaceName && forwardingDomain ? `https://${codespaceName}-${port}.${forwardingDomain}` : undefined;

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

  if (result.error) {
    console.error(`[${name}] failed to start ${pnpm}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  console.log(`[${name}] done`);
}

console.log('Starting AI Arbitrage Codespaces server...');
console.log('Single Nest server mode.');
console.log(`Customer frontend: http://localhost:${port}/`);
console.log(`Admin backend UI:  http://localhost:${port}/admin`);
console.log(`API health:        http://localhost:${port}/api/v1/health`);
if (externalBaseUrl) {
  console.log('');
  console.log(`Codespaces customer URL: ${externalBaseUrl}/`);
  console.log(`Codespaces admin URL:    ${externalBaseUrl}/admin`);
}
console.log('');

run('shared:build', ['--filter', '@twodays/shared', 'build']);
run('web:build', ['--filter', '@twodays/web', 'build']);
run('api:build', ['--filter', '@twodays/api', 'build']);

console.log('');
console.log('Build complete. Starting the web server in this terminal.');
console.log('Keep this terminal open. If the $ prompt comes back, the website is stopped.');
console.log('When you see "Nest application successfully started", open the Codespaces URLs above.');
console.log('');

run(`app:${port}`, ['--filter', '@twodays/api', 'start'], { API_PORT: String(port) });
