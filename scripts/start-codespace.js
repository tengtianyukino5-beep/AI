const { spawn, spawnSync } = require('node:child_process');
const http = require('node:http');

const isWindows = process.platform === 'win32';
const pnpm = isWindows ? 'pnpm.cmd' : 'pnpm';
const port = Number(process.env.API_PORT || process.env.PORT || 3000);
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
console.log('Single-port mode for Codespaces.');
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

const api = start(`api:${port}`, ['--filter', '@twodays/api', 'start'], { API_PORT: String(port) });

void waitForHealth(port).then(async (ready) => {
  if (!ready) {
    console.error('');
    console.error(`Server did not answer on http://localhost:${port}/api/v1/health within 30 seconds.`);
    console.error('Check the API log above for the real error, then stop this terminal with Ctrl+C and run pnpm codespace again.');
    return;
  }
  const frontendReady = await waitForFrontend(port);
  if (!frontendReady) {
    console.error('');
    console.error(`API is running, but the frontend did not answer on http://localhost:${port}/ within 30 seconds.`);
    console.error('This usually means apps/web/dist was not found by the API server. Stop this terminal with Ctrl+C and run pnpm codespace again.');
    return;
  }
  console.log('');
  console.log('AI Arbitrage Codespaces server is ready.');
  console.log(`Open customer frontend: http://localhost:${port}/`);
  console.log(`Open admin backend:     http://localhost:${port}/admin`);
  if (externalBaseUrl) {
    console.log(`Codespaces customer:    ${externalBaseUrl}/`);
    console.log(`Codespaces admin:       ${externalBaseUrl}/admin`);
  }
  console.log('');
});

function shutdown() {
  api.kill('SIGTERM');
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function waitForHealth(portNumber) {
  return waitForHttpOk(`http://127.0.0.1:${portNumber}/api/v1/health`);
}

function waitForFrontend(portNumber) {
  return waitForHttpOk(`http://127.0.0.1:${portNumber}/`);
}

function waitForHttpOk(url) {
  const deadline = Date.now() + 30000;
  return new Promise((resolve) => {
    const check = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
          resolve(true);
          return;
        }
        retry();
      });
      request.on('error', retry);
      request.setTimeout(1500, () => {
        request.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() >= deadline) {
        resolve(false);
        return;
      }
      setTimeout(check, 1000);
    };
    check();
  });
}
