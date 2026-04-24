import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../core/database/prisma.service';
import { compare, hash } from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { type AuthUser } from './types/auth-user.type';
import { type ActiveUser } from '../users/users.repository';

type RefreshTokenData = {
  token: string;
  jti: string;
  tokenHash: string;
  expiresAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await hash(registerDto.password, 12);

    const user = await this.usersService.createUser({
      email: registerDto.email,
      password: passwordHash,
      name: registerDto.name,
    });

    return this.issueTokenPair(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordCorrect = await compare(loginDto.password, user.password);

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokenPair(user);
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const refreshPayload = await this.verifyRefreshToken(refreshTokenDto);

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { jti: refreshPayload.jti },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.user.deletedAt !== null) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.revokedAt || tokenRecord.expiresAt <= new Date()) {
      await this.revokeAllRefreshTokensForUser(tokenRecord.userId);
      throw new UnauthorizedException('Refresh token has expired or revoked');
    }

    const isTokenValid = await compare(
      refreshTokenDto.refreshToken,
      tokenRecord.tokenHash,
    );

    if (!isTokenValid) {
      await this.revokeAllRefreshTokensForUser(tokenRecord.userId);
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.rotateRefreshToken(
      tokenRecord.id,
      tokenRecord.user as ActiveUser,
    );
  }

  async logout(refreshTokenDto: RefreshTokenDto) {
    const refreshPayload = await this.verifyRefreshToken(refreshTokenDto);

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { jti: refreshPayload.jti },
    });

    if (
      !tokenRecord ||
      tokenRecord.revokedAt ||
      tokenRecord.expiresAt <= new Date()
    ) {
      return { success: true };
    }

    const isTokenValid = await compare(
      refreshTokenDto.refreshToken,
      tokenRecord.tokenHash,
    );

    if (!isTokenValid) {
      return { success: true };
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  async getMe(userId: number) {
    const user = await this.usersService.findByIdOrThrow(userId);

    return {
      user: this.usersService.toPublicUser(user),
    };
  }

  async verifyJwtPayload(payload: AuthUser): Promise<AuthUser> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid access token');
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }

  private async issueTokenPair(user: ActiveUser) {
    const payload: AuthUser = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const { token: refreshToken } = await this.createAndStoreRefreshToken(
      user.id,
    );

    return {
      accessToken,
      refreshToken,
      user: this.usersService.toPublicUser(user),
    };
  }

  private async generateRefreshTokenData(
    userId: number,
  ): Promise<RefreshTokenData> {
    const ttl = this.configService.get<number>(
      'REFRESH_TOKEN_EXPIRES_IN_SECONDS',
      604800,
    );
    const secret = this.configService.getOrThrow<string>(
      'REFRESH_TOKEN_SECRET',
    );

    const jti = randomUUID();
    const token = await this.jwtService.signAsync(
      { sub: userId, jti },
      { secret, expiresIn: ttl },
    );
    const tokenHash = await hash(token, 12);
    const expiresAt = new Date(Date.now() + ttl * 1000);

    return { token, jti, tokenHash, expiresAt };
  }

  private async createAndStoreRefreshToken(
    userId: number,
  ): Promise<RefreshTokenData> {
    const data = await this.generateRefreshTokenData(userId);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        jti: data.jti,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });

    return data;
  }

  private async rotateRefreshToken(oldTokenId: number, user: ActiveUser) {
    const payload: AuthUser = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshData = await this.generateRefreshTokenData(user.id);

    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: oldTokenId },
        data: { revokedAt: new Date() },
      });

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          jti: refreshData.jti,
          tokenHash: refreshData.tokenHash,
          expiresAt: refreshData.expiresAt,
        },
      });
    });

    return {
      accessToken,
      refreshToken: refreshData.token,
      user: this.usersService.toPublicUser(user),
    };
  }

  private async verifyRefreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ sub: number; jti: string }> {
    try {
      return await this.jwtService.verifyAsync<{ sub: number; jti: string }>(
        refreshTokenDto.refreshToken,
        {
          secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async revokeAllRefreshTokensForUser(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
