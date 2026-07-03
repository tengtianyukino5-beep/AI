import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      /^https:\/\/.*\.app\.github\.dev$/,
      'http://127.0.0.1:3000',
      'http://localhost:3000',
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

  await app.init();

  const ports = getListenPorts();
  const activePorts: number[] = [];

  for (const port of ports) {
    try {
      await listenOnPort(app.getHttpAdapter().getInstance(), port);
      activePorts.push(port);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Port ${port} was not started: ${message}`);
    }
  }

  if (activePorts.length === 0) {
    throw new Error(`No web port could be started. Tried: ${ports.join(', ')}`);
  }

  console.log(`AI Arbitrage Web listening on ports: ${activePorts.join(', ')}`);
}

function getListenPorts() {
  const primaryPort = toPort(process.env.API_PORT ?? process.env.PORT, 3000) ?? 3000;
  return [primaryPort];
}

function toPort(value: string | number | undefined, fallback?: number) {
  const port = Number(value);
  if (Number.isInteger(port) && port > 0 && port < 65536) {
    return port;
  }
  return fallback;
}

function listenOnPort(server: { listen: (...args: unknown[]) => unknown }, port: number) {
  return new Promise<void>((resolve, reject) => {
    const listener = server.listen(port, '0.0.0.0', () => resolve()) as {
      once: (event: string, callback: (error: Error) => void) => void;
    };
    listener.once('error', reject);
  });
}

void bootstrap();
