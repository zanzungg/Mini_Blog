import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthService } from '../../modules/auth/auth.service';
import { type AuthUser } from '../../modules/auth/types/auth-user.type';
import { MaintenanceService } from '../../modules/maintenance/maintenance.service';
import { MaintenanceModeException } from '../exceptions/maintenance-mode.exception';

type RequestWithAuthUser = Request & {
  user?: AuthUser;
};

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly maintenanceService: MaintenanceService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuthUser>();
    const { enabled, message } =
      await this.maintenanceService.getMaintenanceConfig();

    if (!enabled) {
      return true;
    }

    const clientIp = this.getClientIp(request);

    if (clientIp && (await this.maintenanceService.isIpWhitelisted(clientIp))) {
      return true;
    }

    const email = this.getEmailFromBody(request);

    if (email && (await this.maintenanceService.isEmailWhitelisted(email))) {
      return true;
    }

    const token = this.extractBearerToken(request);

    if (token) {
      const authUser = await this.tryResolveUser(token);

      if (authUser) {
        request.user = authUser;

        if (await this.maintenanceService.isUserWhitelisted(authUser.userId)) {
          return true;
        }
      }
    }

    throw new MaintenanceModeException(message);
  }

  private async tryResolveUser(token: string): Promise<AuthUser | null> {
    try {
      const payload = await this.jwtService.verifyAsync<AuthUser>(token);
      return await this.authService.verifyJwtPayload(payload);
    } catch {
      return null;
    }
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

  private getEmailFromBody(request: Request): string | null {
    const raw = (request.body as { email?: unknown } | undefined)?.email;

    if (typeof raw !== 'string') {
      return null;
    }

    const email = raw.trim();

    return email.length > 0 ? email : null;
  }

  private getClientIp(request: Request): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;

    if (raw) {
      const first = raw.split(',')[0]?.trim();
      return this.normalizeIp(first);
    }

    return this.normalizeIp(request.ip);
  }

  private normalizeIp(ip?: string): string | null {
    if (!ip) {
      return null;
    }

    if (ip.startsWith('::ffff:')) {
      return ip.slice(7);
    }

    return ip;
  }
}
