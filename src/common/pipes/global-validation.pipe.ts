import {
  BadRequestException,
  Injectable,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

@Injectable()
export class GlobalValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        const details = this.flattenErrors(errors);

        return new BadRequestException({
          message: 'Validation failed',
          errors: details,
        });
      },
    });
  }

  private flattenErrors(
    errors: ValidationError[],
    parentPath = '',
  ): { field: string; message: string }[] {
    return errors.flatMap((error) => {
      const fieldPath = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;

      const constraints = error.constraints
        ? Object.values(error.constraints).map((message) => ({
            field: fieldPath,
            message,
          }))
        : [];

      const children = error.children?.length
        ? this.flattenErrors(error.children, fieldPath)
        : [];

      return [...constraints, ...children];
    });
  }
}
