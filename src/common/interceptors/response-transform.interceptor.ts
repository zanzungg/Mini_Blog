import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, map } from 'rxjs';

type SuccessResponse = {
  status: 'success';
  statusCode: number;
  data: unknown;
};

function isResponseEnvelope(value: unknown): value is {
  status: string;
  statusCode: number;
  data?: unknown;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'statusCode' in value
  );
}

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        if (isResponseEnvelope(data)) {
          return data;
        }

        const statusCode = response.statusCode ?? 200;

        const body: SuccessResponse = {
          status: 'success',
          statusCode,
          data,
        };

        return body;
      }),
    );
  }
}
