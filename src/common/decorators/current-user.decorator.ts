import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { type Request } from 'express';
import { type AuthUser } from '../../modules/auth/types/auth-user.type';

type RequestWithAuthUser = Request & {
  user?: AuthUser;
};

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<RequestWithAuthUser>();

    return request.user as AuthUser;
  },
);
