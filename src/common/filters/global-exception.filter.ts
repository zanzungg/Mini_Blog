import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

type RequestWithStartTime = Request & {
  requestStartedAt?: number;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithStartTime>();
    const response = ctx.getResponse<Response>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const { message, errors } = this.normalizeError(
      exceptionResponse,
      exception,
      statusCode,
    );

    const responseBody = {
      status: 'error',
      statusCode,
      data: null,
      message,
      ...(errors && { errors }),
    };

    this.logException(exception, request, statusCode);

    response.status(statusCode).json(responseBody);
  }

  private normalizeError(
    exceptionResponse: unknown,
    exception: unknown,
    statusCode: number,
  ): { message: string; errors?: any[] } {
    if (!exceptionResponse) {
      return {
        message:
          statusCode >= 500
            ? 'Internal server error'
            : exception instanceof Error
              ? exception.message
              : 'Unexpected error',
      };
    }

    if (typeof exceptionResponse === 'string') {
      return { message: exceptionResponse };
    }

    if (typeof exceptionResponse === 'object') {
      const res = exceptionResponse as any;

      if (res.errors && Array.isArray(res.errors)) {
        return {
          message: res.message || 'Validation failed',
          errors: res.errors,
        };
      }

      if (Array.isArray(res.message)) {
        return {
          message: res.message[0],
          errors: res.message,
        };
      }

      if (typeof res.message === 'string') {
        return { message: res.message };
      }

      if (res.error) {
        return { message: res.error };
      }
    }

    return {
      message: statusCode >= 500 ? 'Internal server error' : 'Unexpected error',
    };
  }

  private logException(
    exception: unknown,
    request: RequestWithStartTime,
    statusCode: number,
  ) {
    const { method, url } = request;
    const responseTime = request.requestStartedAt
      ? Date.now() - request.requestStartedAt
      : undefined;

    const logMessage = `${method} ${url} -> ${statusCode}${
      responseTime !== undefined ? ` - ${responseTime}ms` : ''
    }`;

    if (statusCode >= 500) {
      this.logger.error(
        logMessage,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
      );
    } else {
      this.logger.warn(logMessage);
    }
  }
}
