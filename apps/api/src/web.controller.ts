import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

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

@Controller()
export class WebController {
  @Get()
  customer(@Res() response: WebResponse) {
    return this.sendIndex(response);
  }

  @Get('admin')
  admin(@Res() response: WebResponse) {
    return this.sendIndex(response);
  }

  @Get('admin/*')
  adminNested(@Res() response: WebResponse) {
    return this.sendIndex(response);
  }

  @Get('assets/:file')
  asset(@Param('file') file: string, @Res() response: WebResponse) {
    return this.sendStatic(response, `assets/${file}`);
  }

  @Get('*')
  frontendFallback(@Req() request: WebRequest, @Res() response: WebResponse) {
    if (request.path.startsWith('/api') || request.path.startsWith('/api-docs')) {
      return response.status(404).type('text/plain; charset=utf-8').send('Not Found');
    }
    const staticPath = request.path.replace(/^\/+/, '');
    if (extname(staticPath)) {
      return this.sendStatic(response, staticPath);
    }
    return this.sendIndex(response);
  }

  private sendIndex(response: WebResponse) {
    return this.sendStatic(response, 'index.html', true);
  }

  private sendStatic(response: WebResponse, requestedPath: string, fallbackToIndex = false) {
    const webRoot = this.findWebDist();
    if (!webRoot) {
      return response
        .status(503)
        .type('text/plain; charset=utf-8')
        .send('Web frontend build was not found. Run pnpm codespace again so apps/web/dist is created.');
    }

    const targetPath = resolve(webRoot, requestedPath);
    const safeTarget = this.isInside(webRoot, targetPath) && existsSync(targetPath) && statSync(targetPath).isFile();
    const filePath = safeTarget ? targetPath : fallbackToIndex ? join(webRoot, 'index.html') : '';
    if (!filePath) {
      return response.status(404).type('text/plain; charset=utf-8').send('Asset not found.');
    }

    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('X-AI-Arbitrage-Web', 'controller');
    response.type(mimeTypes[extname(filePath)] ?? 'application/octet-stream');
    return response.status(200).send(readFileSync(filePath));
  }

  private findWebDist() {
    const candidates = [
      resolve(process.cwd(), 'apps/web/dist'),
      resolve(process.cwd(), '../web/dist'),
      resolve(__dirname, '../../web/dist'),
      resolve(__dirname, '../../../apps/web/dist'),
    ];

    return candidates.find((candidate) => existsSync(join(candidate, 'index.html')));
  }

  private isInside(root: string, target: string) {
    const path = relative(root, target);
    return path === '' || (!path.startsWith('..') && !resolve(path).startsWith('..'));
  }
}

type WebResponse = {
  setHeader: (key: string, value: string) => void;
  status: (code: number) => WebResponse;
  type: (value: string) => WebResponse;
  send: (body: Buffer | string) => void;
};

type WebRequest = {
  path: string;
};
