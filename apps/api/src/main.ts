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

  const configuredPort = Number(process.env.API_PORT ?? process.env.PORT ?? 8080);
  const port = Number.isFinite(configuredPort) && configuredPort > 0 ? configuredPort : 8080;
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
