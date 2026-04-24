import { Injectable, NotFoundException } from '@nestjs/common';
import { type Role } from '@prisma/client';
import { type ActiveUser, UsersRepository } from './users.repository';

export type PublicUser = {
  id: number;
  email: string;
  name: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

type PublicUserSource = Pick<
  ActiveUser,
  'id' | 'email' | 'name' | 'role' | 'createdAt' | 'updatedAt'
>;

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string): Promise<ActiveUser | null> {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: number): Promise<ActiveUser | null> {
    return this.usersRepository.findById(id);
  }

  async findByIdOrThrow(id: number): Promise<ActiveUser> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  createUser(input: {
    email: string;
    password: string;
    name?: string;
  }): Promise<ActiveUser> {
    return this.usersRepository.create(input);
  }

  toPublicUser(user: PublicUserSource): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
