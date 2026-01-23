import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';
import * as morgan from 'morgan';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // LOGGING: Request logging with morgan
  const isDev = process.env.NODE_ENV !== 'production';
  app.use(morgan(isDev ? 'dev' : 'combined'));

  // SECURITY: Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for API - enable with proper CSP for web
    crossOriginEmbedderPolicy: false, // For mobile app compatibility
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for uploads
  }));

  // SECURITY: Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // Strip properties not in DTO
    forbidNonWhitelisted: false, // Don't throw on unknown properties (for backward compatibility)
    transform: true,           // Auto-transform payloads to DTO types
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  app.use(
    bodyParser.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
      },
    }),
  );
  app.use(
    bodyParser.urlencoded({
      extended: true,
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
      },
    }),
  );
  const allowOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001'];

  // In development, allow all origins for mobile testing
  app.enableCors({
    origin: isDev ? true : allowOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Serve uploaded files as static assets
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`HTTP server running on port ${port} (all interfaces)`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});

