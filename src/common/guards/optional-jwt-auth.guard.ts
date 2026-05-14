import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthService } from '../../modules/auth/auth.service';
import { type AuthUser } from '../../modules/auth/types/auth-user.type';

type RequestWithAuthUser = Request & {
  user?: AuthUser;
};

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuthUser>();

    const token = this.extractBearerToken(request);

    if (!token) {
      return true;
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthUser>(token);

      request.user = await this.authService.verifyJwtPayload(payload);
    } catch {
      request.user = undefined;
    }

    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
