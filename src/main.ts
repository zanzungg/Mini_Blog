import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type {
  OpenAPIObject,
  ReferenceObject,
  ResponseObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalValidationPipe } from './common/pipes/global-validation.pipe';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

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

function wrapSuccessResponses(document: OpenAPIObject): OpenAPIObject {
  const successSchemaName = 'SuccessResponse';
  const errorSchemaName = 'ErrorResponse';

  if (!document.components) {
    document.components = {};
  }

  if (!document.components.schemas) {
    document.components.schemas = {};
  }

  if (!document.components.schemas[successSchemaName]) {
    document.components.schemas[successSchemaName] = {
      type: 'object',
      required: ['status', 'statusCode', 'data'],
      properties: {
        status: { type: 'string', enum: ['success'] },
        statusCode: { type: 'integer', example: 200 },
        data: { nullable: true },
      },
    };
  }

  if (!document.components.schemas[errorSchemaName]) {
    document.components.schemas[errorSchemaName] = {
      type: 'object',
      required: ['status', 'statusCode', 'data', 'message'],
      properties: {
        status: { type: 'string', enum: ['error'] },
        statusCode: { type: 'integer', example: 400 },
        data: { nullable: true },
        message: { type: 'string' },
        errors: {
          type: 'array',
          items: { type: 'object' },
          nullable: true,
        },
      },
    };
  }

  const paths = document.paths ?? {};

  const isResponseObject = (
    value: ResponseObject | ReferenceObject,
  ): value is ResponseObject => !('$ref' in value);

  Object.values(paths).forEach((pathItem) => {
    const operations = Object.values(pathItem ?? {});

    operations.forEach((operation) => {
      if (!operation || typeof operation !== 'object') return;

      const responses = operation.responses ?? {};

      Object.entries(responses).forEach(([statusCode, response]) => {
        if (!statusCode.startsWith('2')) return;
        if (!response || typeof response !== 'object') return;

        const responseObject = response as ResponseObject | ReferenceObject;
        if (!isResponseObject(responseObject)) return;

        const content = responseObject.content ?? {};
        const jsonMedia = content['application/json'];

        if (!jsonMedia) return;

        const schema = jsonMedia.schema as
          | SchemaObject
          | ReferenceObject
          | undefined;

        const isWrapped =
          schema &&
          'properties' in schema &&
          !!schema.properties?.status &&
          !!schema.properties?.statusCode &&
          !!schema.properties?.data;

        const isSuccessRef =
          schema &&
          '$ref' in schema &&
          typeof schema.$ref === 'string' &&
          schema.$ref.endsWith(`/${successSchemaName}`);

        if (isWrapped || isSuccessRef) return;

        const wrappedSchema: SchemaObject = {
          type: 'object',
          required: ['status', 'statusCode', 'data'],
          properties: {
            status: { type: 'string', enum: ['success'] },
            statusCode: { type: 'integer', example: 200 },
            data: schema ?? { nullable: true },
          },
        };

        jsonMedia.schema = wrappedSchema;
      });
    });
  });

  return document;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();

  app.useGlobalPipes(new GlobalValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseTransformInterceptor(),
  );

  const configService = app.get(ConfigService);

  // Swagger (OpenAPI) setup — toggle with SWAGGER_ENABLED env var
  const swaggerEnabled = configService.get<boolean>('SWAGGER_ENABLED', true);
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Mini Blog API')
      .setDescription('API documentation for the Mini Blog backend')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
        },
        'jwt',
      )
      .build();

    const document = wrapSuccessResponses(
      SwaggerModule.createDocument(app, swaggerConfig),
    );
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

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
