import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryMaintenanceIpsDto } from './dto/query-maintenance-ips.dto';
import { QueryMaintenanceUsersDto } from './dto/query-maintenance-users.dto';
import { MaintenanceRepository } from './maintenance.repository';

const MAINTENANCE_ENABLED_KEY = 'maintenance.enabled';
const MAINTENANCE_MESSAGE_KEY = 'maintenance.message';

type MaintenanceConfig = {
  enabled: boolean;
  message?: string;
};

@Injectable()
export class MaintenanceService {
  private cache: { config: MaintenanceConfig; loadedAt: number } | null = null;
  private readonly cacheTtlMs = 5000;

  constructor(private readonly maintenanceRepository: MaintenanceRepository) {}

  async getMaintenanceConfig(): Promise<MaintenanceConfig> {
    if (this.cache && Date.now() - this.cache.loadedAt < this.cacheTtlMs) {
      return this.cache.config;
    }

    const settings = await this.maintenanceRepository.getSettings([
      MAINTENANCE_ENABLED_KEY,
      MAINTENANCE_MESSAGE_KEY,
    ]);

    const enabledRaw = settings.get(MAINTENANCE_ENABLED_KEY);
    const enabled = enabledRaw === 'true' || enabledRaw === '1';

    const message = settings.get(MAINTENANCE_MESSAGE_KEY) || undefined;

    const config = {
      enabled,
      message,
    };

    this.cache = {
      config,
      loadedAt: Date.now(),
    };

    return config;
  }

  async updateMaintenanceConfig(input: {
    enabled?: boolean;
    message?: string;
  }): Promise<MaintenanceConfig> {
    const updates: Promise<void>[] = [];

    if (input.enabled !== undefined) {
      updates.push(
        this.maintenanceRepository.setSetting(
          MAINTENANCE_ENABLED_KEY,
          input.enabled ? 'true' : 'false',
        ),
      );
    }

    if (input.message !== undefined) {
      updates.push(
        this.maintenanceRepository.setSetting(
          MAINTENANCE_MESSAGE_KEY,
          input.message,
        ),
      );
    }

    if (updates.length > 0) {
      await Promise.all(updates);
      this.invalidateCache();
    }

    return this.getMaintenanceConfig();
  }

  async listMaintenanceUsers(query: QueryMaintenanceUsersDto): Promise<{
    data: Array<{
      id: number;
      userId: number;
      createdAt: Date;
      user: {
        id: number;
        email: string;
        name: string | null;
      };
    }>;
    meta: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [users, totalItems] = await Promise.all([
      this.maintenanceRepository.listMaintenanceUsers({
        skip,
        take: limit,
      }),
      this.maintenanceRepository.countMaintenanceUsers(),
    ]);

    return {
      data: users,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async addMaintenanceUserByEmail(email: string): Promise<{ success: true }> {
    const userId = await this.maintenanceRepository.findUserIdByEmail(email);

    if (!userId) {
      throw new NotFoundException('User not found');
    }

    const alreadyWhitelisted =
      await this.maintenanceRepository.findMaintenanceUserByUserId(userId);

    if (alreadyWhitelisted) {
      throw new ConflictException('User already whitelisted');
    }

    await this.maintenanceRepository.createMaintenanceUser(userId);

    return { success: true };
  }

  async removeMaintenanceUser(userId: number): Promise<{ success: true }> {
    const removed =
      await this.maintenanceRepository.deleteMaintenanceUser(userId);

    if (!removed) {
      throw new NotFoundException('User not found');
    }

    return { success: true };
  }

  async listMaintenanceIps(query: QueryMaintenanceIpsDto): Promise<{
    data: Array<{ id: number; ip: string; createdAt: Date }>;
    meta: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [ips, totalItems] = await Promise.all([
      this.maintenanceRepository.listMaintenanceIps({
        skip,
        take: limit,
      }),
      this.maintenanceRepository.countMaintenanceIps(),
    ]);

    return {
      data: ips,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async addMaintenanceIp(ip: string): Promise<{ success: true }> {
    const alreadyWhitelisted =
      await this.maintenanceRepository.findMaintenanceIpByIp(ip);

    if (alreadyWhitelisted) {
      throw new ConflictException('IP already whitelisted');
    }

    await this.maintenanceRepository.createMaintenanceIp(ip);

    return { success: true };
  }

  async removeMaintenanceIp(ip: string): Promise<{ success: true }> {
    const removed = await this.maintenanceRepository.deleteMaintenanceIp(ip);

    if (!removed) {
      throw new NotFoundException('IP not found');
    }

    return { success: true };
  }

  isIpWhitelisted(ip: string): Promise<boolean> {
    return this.maintenanceRepository.isIpWhitelisted(ip);
  }

  isUserWhitelisted(userId: number): Promise<boolean> {
    return this.maintenanceRepository.isUserWhitelisted(userId);
  }

  async isEmailWhitelisted(email: string): Promise<boolean> {
    const userId = await this.maintenanceRepository.findUserIdByEmail(email);

    if (!userId) {
      return false;
    }

    return this.maintenanceRepository.isUserWhitelisted(userId);
  }

  invalidateCache(): void {
    this.cache = null;
  }
}
