import { HttpException, HttpStatus } from '@nestjs/common';

export class MaintenanceModeException extends HttpException {
  readonly messageText?: string;

  constructor(messageText?: string) {
    super(
      {
        message: messageText || 'Service is in maintenance mode',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );

    this.messageText = messageText;
  }
}
