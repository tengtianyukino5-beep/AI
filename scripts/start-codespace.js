const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const isWindows = process.platform === 'win32';
const pnpm = isWindows ? 'pnpm.cmd' : 'pnpm';
const publicPort = Number(process.env.PORT || process.env.CODESPACE_PORT || 3000);
const apiPort = Number(process.env.API_INTERNAL_PORT || publicPort + 1000);
const codespaceName = process.env.CODESPACE_NAME;
const forwardingDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
const externalBaseUrl =
  codespaceName && forwardingDomain ? `https://${codespaceName}-${publicPort}.${forwardingDomain}` : undefined;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.map': 'application/json; charset=utf-8',
};

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
console.log('Single public-port mode for Codespaces.');
console.log(`Customer frontend: http://localhost:${publicPort}/`);
console.log(`Admin backend UI:  http://localhost:${publicPort}/admin`);
console.log(`API health:        http://localhost:${publicPort}/api/v1/health`);
console.log(`Internal API:      http://127.0.0.1:${apiPort}/api/v1/health`);
if (externalBaseUrl) {
  console.log('');
  console.log(`Codespaces customer URL: ${externalBaseUrl}/`);
  console.log(`Codespaces admin URL:    ${externalBaseUrl}/admin`);
}
console.log('');

run('shared:build', ['--filter', '@twodays/shared', 'build']);
run('web:build', ['--filter', '@twodays/web', 'build']);
run('api:build', ['--filter', '@twodays/api', 'build']);

const webRoot = findWebDist();
if (!webRoot) {
  console.error('');
  console.error('Cannot find apps/web/dist/index.html after build.');
  console.error('Stop here and check the web build output above.');
  process.exit(1);
}

const api = start(`api:${apiPort}`, ['--filter', '@twodays/api', 'start'], { API_PORT: String(apiPort) });
const frontend = startFrontendServer(webRoot, publicPort, apiPort);

void waitForHealth(apiPort).then(async (ready) => {
  if (!ready) {
    console.error('');
    console.error(`Internal API did not answer on http://127.0.0.1:${apiPort}/api/v1/health within 30 seconds.`);
    console.error('Check the API log above for the real error, then stop this terminal with Ctrl+C and run pnpm codespace again.');
    return;
  }
  const frontendReady = await waitForFrontend(publicPort);
  if (!frontendReady) {
    console.error('');
    console.error(`Frontend did not answer on http://127.0.0.1:${publicPort}/ within 30 seconds.`);
    console.error('The static frontend server is not running. Stop this terminal with Ctrl+C and run pnpm codespace again.');
    return;
  }
  console.log('');
  console.log('AI Arbitrage Codespaces server is ready.');
  console.log(`Serving web app from: ${webRoot}`);
  console.log(`Open customer frontend: http://localhost:${publicPort}/`);
  console.log(`Open admin backend:     http://localhost:${publicPort}/admin`);
  if (externalBaseUrl) {
    console.log(`Codespaces customer:    ${externalBaseUrl}/`);
    console.log(`Codespaces admin:       ${externalBaseUrl}/admin`);
  }
  console.log('');
});

function startFrontendServer(webRootPath, portNumber, targetApiPort) {
  const server = http.createServer((request, response) => {
    const url = request.url || '/';
    if (url.startsWith('/api/') || url.startsWith('/api-docs')) {
      proxyToApi(request, response, targetApiPort);
      return;
    }

    serveWebFile(webRootPath, request, response);
  });

  server.on('error', (error) => {
    console.error('');
    console.error(`Frontend server failed to start on port ${portNumber}.`);
    console.error(error instanceof Error ? error.message : String(error));
    console.error('Stop any old terminal running pnpm codespace, then run pnpm codespace again.');
    shutdown();
  });

  server.listen(portNumber, '0.0.0.0', () => {
    console.log(`[web:${portNumber}] serving ${webRootPath}`);
  });

  return server;
}

function proxyToApi(request, response, targetApiPort) {
  const proxyRequest = http.request(
    {
      hostname: '127.0.0.1',
      port: targetApiPort,
      path: request.url,
      method: request.method,
      headers: {
        ...request.headers,
        host: `127.0.0.1:${targetApiPort}`,
      },
    },
    (proxyResponse) => {
      response.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
      proxyResponse.pipe(response);
    },
  );

  proxyRequest.on('error', (error) => {
    response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ code: 'ERROR', message: `API proxy failed: ${error.message}`, data: null }));
  });

  request.pipe(proxyRequest);
}

function serveWebFile(webRootPath, request, response) {
  if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
    response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Method Not Allowed');
    return;
  }

  const parsed = new URL(request.url || '/', 'http://localhost');
  const pathname = decodeURIComponent(parsed.pathname);
  const hasExtension = Boolean(path.extname(pathname));
  const requested = pathname === '/' || !hasExtension ? 'index.html' : pathname.replace(/^\/+/, '');
  const candidate = path.resolve(webRootPath, requested);
  const safeFile =
    candidate.startsWith(webRootPath) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()
      ? candidate
      : hasExtension
        ? undefined
        : path.join(webRootPath, 'index.html');

  if (!safeFile) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not Found');
    return;
  }

  response.writeHead(200, {
    'Cache-Control': path.basename(safeFile) === 'index.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    'Content-Type': mimeTypes[path.extname(safeFile)] || 'application/octet-stream',
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  fs.createReadStream(safeFile).pipe(response);
}

function shutdown() {
  frontend.close();
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

function findWebDist() {
  const candidates = [
    path.resolve(process.cwd(), 'apps/web/dist'),
    path.resolve(process.cwd(), '../web/dist'),
    path.resolve(__dirname, '../apps/web/dist'),
  ];

  return candidates.find((candidate) => fs.existsSync(path.join(candidate, 'index.html')));
}
