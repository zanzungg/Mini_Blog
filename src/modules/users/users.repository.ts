import { Injectable } from '@nestjs/common';
import { Role, type User } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';

export type ActiveUser = Omit<User, 'deletedAt'> & {
  deletedAt: null;
};

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

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
}
