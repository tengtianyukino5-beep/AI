import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { existsSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: [
      /^https:\/\/.*\.app\.github\.dev$/,
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://localhost:5173',
    ],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('AI Arbitrage Web MVP API')
    .setDescription('Site-internal simulated AI arbitrage backend API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  serveWebApp(app);

  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();

function serveWebApp(app: {
  getHttpAdapter: () => {
    getInstance: () => {
      get: (path: string | RegExp | Array<string | RegExp>, handler: unknown) => void;
      use: (handler: unknown) => void;
    };
  };
}) {
  const webRoot = findWebDist();
  if (!webRoot) {
    console.warn('Web dist was not found. Build apps/web before starting the API server.');
    return;
  }

  const mimeTypes: Record<string, string> = {
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
  };

  const server = app.getHttpAdapter().getInstance();
  console.log(`Serving web app from ${webRoot}`);

  const sendWebApp = (
    request: { method?: string; url?: string },
    response: { setHeader: (key: string, value: string) => void; status?: (code: number) => unknown; sendFile: (path: string) => void },
    next?: () => void,
  ) => {
    const method = request.method ?? 'GET';
    const url = request.url ?? '/';
    if (!['GET', 'HEAD'].includes(method) || url.startsWith('/api/') || url.startsWith('/api-docs')) {
      next?.();
      return;
    }

    const pathname = decodeURIComponent(url.split('?')[0] || '/');
    const requested = pathname === '/' || !extname(pathname) ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = resolve(webRoot, requested);
    const safePath = filePath.startsWith(webRoot) && existsSync(filePath) && statSync(filePath).isFile() ? filePath : join(webRoot, 'index.html');

    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Content-Type', mimeTypes[extname(safePath)] ?? 'application/octet-stream');
    response.status?.(200);
    response.sendFile(safePath);
  };

  server.get(['/', '/admin', /^\/admin\/.*$/], sendWebApp);
  server.use(sendWebApp);
}

function findWebDist() {
  const candidates = [
    resolve(process.cwd(), 'apps/web/dist'),
    resolve(process.cwd(), '../web/dist'),
    resolve(__dirname, '../../web/dist'),
    resolve(__dirname, '../../../apps/web/dist'),
  ];

  return candidates.find((candidate) => existsSync(join(candidate, 'index.html')));
}
