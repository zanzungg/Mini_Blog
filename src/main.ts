import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalValidationPipe } from './common/pipes/global-validation.pipe';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

function parseCorsOrigins(value?: string): string | string[] | boolean {
  if (!value) return false;
  const v = value.trim();
  if (!v || v === 'false') return false;
  if (v === '*') return true;
  const parts = v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length === 1 ? parts[0] : parts;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();

  app.useGlobalPipes(new GlobalValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const configService = app.get(ConfigService);

  // Helmet - set secure HTTP headers early
  app.use(helmet());

  // If running behind proxy/load balancer and env enables it
  if (configService.get<boolean>('TRUST_PROXY', false)) {
    app.set('trust proxy', 1);
  }

  // CORS from env
  app.enableCors({
    origin: parseCorsOrigins(configService.get<string>('CORS_ORIGIN')),
    credentials: configService.get<boolean>('CORS_CREDENTIALS', false),
  });

  const port = configService.get<number>('APP_PORT', 3000);

  await app.listen(port);
}

bootstrap();
