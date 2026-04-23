import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = response.statusCode;
          const responseTime = Date.now() - now;

          this.logger.log(`${method} ${url} ${statusCode} - ${responseTime}ms`);
        },
        error: (err) => {
          const statusCode = response.statusCode;
          const responseTime = Date.now() - now;

          this.logger.error(
            `${method} ${url} ${statusCode} - ${responseTime}ms`,
            err?.stack,
          );
        },
      }),
    );
  }
}
