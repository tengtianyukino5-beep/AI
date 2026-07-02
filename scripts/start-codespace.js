const { spawn, spawnSync } = require('node:child_process');
const http = require('node:http');

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

function waitForWebServer(expectedPort, attempts = 40) {
  let currentAttempt = 0;

  return new Promise((resolve, reject) => {
    const check = () => {
      currentAttempt += 1;
      const request = http.request(
        {
          hostname: '127.0.0.1',
          port: expectedPort,
          path: '/',
          method: 'GET',
          timeout: 1500,
        },
        (response) => {
          response.resume();
          const controllerHeader = response.headers['x-ai-arbitrage-web'];
          if (response.statusCode === 200 && controllerHeader === 'controller') {
            resolve();
            return;
          }
          retryOrReject(
            reject,
            check,
            currentAttempt,
            attempts,
            `HTTP ${response.statusCode}, X-AI-Arbitrage-Web=${controllerHeader || 'missing'}`,
          );
        },
      );

      request.on('timeout', () => {
        request.destroy(new Error('request timeout'));
      });
      request.on('error', (error) => {
        retryOrReject(reject, check, currentAttempt, attempts, error.message);
      });
      request.end();
    };

    check();
  });
}

function retryOrReject(reject, retry, currentAttempt, attempts, reason) {
  if (currentAttempt >= attempts) {
    reject(new Error(reason));
    return;
  }
  setTimeout(retry, 1000);
}

function startApp(name, args, env = {}) {
  const child = spawn(pnpm, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
    },
    stdio: 'inherit',
    shell: false,
  });

  child.on('error', (error) => {
    console.error(`[${name}] failed to start ${pnpm}: ${error.message}`);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[${name}] stopped by ${signal}`);
      process.exit(1);
    }
    process.exit(code ?? 0);
  });

  waitForWebServer(port)
    .then(() => {
      console.log('');
      console.log(`Local self-check passed: http://localhost:${port}/ returned the web app.`);
      if (externalBaseUrl) {
        console.log(`Open customer frontend: ${externalBaseUrl}/`);
        console.log(`Open admin backend:    ${externalBaseUrl}/admin`);
      }
      console.log('');
    })
    .catch((error) => {
      console.error('');
      console.error(`Local self-check failed on port ${port}: ${error.message}`);
      console.error('The source server did not return the web app. Check the logs above before opening Codespaces ports.');
      console.error('');
    });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      child.kill(signal);
    });
  }
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

startApp(`app:${port}`, ['--filter', '@twodays/api', 'start'], { API_PORT: String(port) });
