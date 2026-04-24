import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';

type RequestWithStartTime = Request & {
  requestStartedAt?: number;
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<RequestWithStartTime>();
    const response = httpContext.getResponse<Response>();

    const { method, url } = request;
    const startedAt = Date.now();
    request.requestStartedAt = startedAt;

    // Log only successful requests here. Error logs are handled by GlobalExceptionFilter.
    response.once('finish', () => {
      const statusCode = response.statusCode;

      if (statusCode < 400) {
        const responseTime = Date.now() - startedAt;
        this.logger.log(`${method} ${url} ${statusCode} - ${responseTime}ms`);
      }
    });

    return next.handle();
  }
}
