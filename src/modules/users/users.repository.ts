import { Injectable } from '@nestjs/common';
import { Role, type User } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';

export type ActiveUser = Omit<User, 'deletedAt'> & {
  deletedAt: null;
};

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: {
    skip: number;
    take: number;
    search?: string;
    role?: Role;
  }): Promise<ActiveUser[]> {
    const { skip, take, search, role } = params;

    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        role,
        ...(search
          ? {
              OR: [
                {
                  email: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    }) as Promise<ActiveUser[]>;
  }

  countActive(params: { search?: string; role?: Role }): Promise<number> {
    const { search, role } = params;

    return this.prisma.user.count({
      where: {
        deletedAt: null,
        role,
        ...(search
          ? {
              OR: [
                {
                  email: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
    });
  }

  findByEmail(email: string): Promise<ActiveUser | null> {
    return this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    }) as Promise<ActiveUser | null>;
  }

  findById(id: number): Promise<ActiveUser | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    }) as Promise<ActiveUser | null>;
  }

  create(params: {
    email: string;
    password: string;
    name?: string;
    role?: Role;
  }): Promise<ActiveUser> {
    const { email, password, name, role = Role.USER } = params;

    return this.prisma.user.create({
      data: {
        email,
        password,
        name,
        role,
      },
    }) as Promise<ActiveUser>;
  }

  updateById(
    id: number,
    data: {
      name?: string | null;
    },
  ): Promise<ActiveUser | null> {
    return this.prisma.user
      .updateManyAndReturn({
        where: {
          id,
          deletedAt: null,
        },
        data,
      })
      .then((users) => (users[0] as ActiveUser | undefined) ?? null);
  }

  async softDeleteById(id: number): Promise<boolean> {
    const result = await this.prisma.user.updateMany({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return result.count > 0;
  }
}
