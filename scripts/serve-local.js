const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const webRoot = path.join(root, 'apps', 'web', 'dist');
const webPort = Number(process.env.WEB_PORT || 5173);
const apiPort = Number(process.env.API_PORT || 3000);

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
};

function safeJoin(baseDir, requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(baseDir, normalized === '/' ? 'index.html' : normalized);
  return filePath.startsWith(baseDir) ? filePath : null;
}

const webServer = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || '/', `http://127.0.0.1:${webPort}`);
    let filePath = safeJoin(webRoot, requestUrl.pathname);

    if (!filePath) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    try {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
    } catch {
      filePath = path.join(webRoot, 'index.html');
    }

    const body = await fs.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(error instanceof Error ? error.stack : String(error));
  }
});

const apiServer = http.createServer((req, res) => {
  const requestUrl = new URL(req.url || '/', `http://127.0.0.1:${apiPort}`);

  if (requestUrl.pathname === '/api/v1/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(
    JSON.stringify({
      data: null,
      error: { code: 'NOT_FOUND', message: 'Not Found', details: {} },
      requestId: 'local',
    }),
  );
});

webServer.listen(webPort, '127.0.0.1', () => {
  console.log(`TwoDays web: http://127.0.0.1:${webPort}/`);
});

apiServer.listen(apiPort, '127.0.0.1', () => {
  console.log(`TwoDays API health: http://127.0.0.1:${apiPort}/api/v1/health`);
});

function shutdown() {
  webServer.close();
  apiServer.close();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
