import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class MaintenanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(keys: string[]): Promise<Map<string, string>> {
    const rows = await this.prisma.systemSetting.findMany({
      where: {
        key: {
          in: keys,
        },
      },
    });

    const map = new Map<string, string>();

    for (const row of rows) {
      map.set(row.key, row.value);
    }

    return map;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.prisma.systemSetting.upsert({
      where: {
        key,
      },
      create: {
        key,
        value,
      },
      update: {
        value,
      },
    });
  }

  async findMaintenanceUserByUserId(userId: number): Promise<boolean> {
    const entry = await this.prisma.maintenanceUser.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });

    return !!entry;
  }

  async findMaintenanceIpByIp(ip: string): Promise<boolean> {
    const entry = await this.prisma.maintenanceIp.findUnique({
      where: {
        ip,
      },
      select: {
        id: true,
      },
    });

    return !!entry;
  }

  async isIpWhitelisted(ip: string): Promise<boolean> {
    const entry = await this.prisma.maintenanceIp.findUnique({
      where: {
        ip,
      },
      select: {
        id: true,
      },
    });

    return !!entry;
  }

  async isUserWhitelisted(userId: number): Promise<boolean> {
    const entry = await this.prisma.maintenanceUser.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });

    return !!entry;
  }

  async listMaintenanceUsers(): Promise<
    Array<{
      id: number;
      userId: number;
      createdAt: Date;
      user: {
        id: number;
        email: string;
        name: string | null;
      };
    }>
  > {
    return this.prisma.maintenanceUser.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async listMaintenanceIps(): Promise<
    Array<{ id: number; ip: string; createdAt: Date }>
  > {
    return this.prisma.maintenanceIp.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createMaintenanceUser(userId: number): Promise<void> {
    await this.prisma.maintenanceUser.create({
      data: {
        userId,
      },
    });
  }

  async deleteMaintenanceUser(userId: number): Promise<boolean> {
    const result = await this.prisma.maintenanceUser.deleteMany({
      where: {
        userId,
      },
    });

    return result.count > 0;
  }

  async createMaintenanceIp(ip: string): Promise<void> {
    await this.prisma.maintenanceIp.create({
      data: {
        ip,
      },
    });
  }

  async deleteMaintenanceIp(ip: string): Promise<boolean> {
    const result = await this.prisma.maintenanceIp.deleteMany({
      where: {
        ip,
      },
    });

    return result.count > 0;
  }

  async findUserIdByEmail(email: string): Promise<number | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    return user?.id ?? null;
  }
}
