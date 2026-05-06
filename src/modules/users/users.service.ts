import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type Role } from '@prisma/client';
import { type ActiveUser, UsersRepository } from './users.repository';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { type AuthUser } from '../auth/types/auth-user.type';

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

  async findUsers(queryUsersDto: QueryUsersDto): Promise<{
    data: PublicUser[];
    meta: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    const page = queryUsersDto.page ?? 1;
    const limit = queryUsersDto.limit ?? 10;
    const skip = (page - 1) * limit;

    const [users, totalItems] = await Promise.all([
      this.usersRepository.findMany({
        skip,
        take: limit,
        search: queryUsersDto.search,
        role: queryUsersDto.role,
      }),
      this.usersRepository.countActive({
        search: queryUsersDto.search,
        role: queryUsersDto.role,
      }),
    ]);

    return {
      data: users.map((user) => this.toPublicUser(user)),
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

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

  async getPublicUserById(id: number): Promise<{ user: PublicUser }> {
    const user = await this.findByIdOrThrow(id);

    return {
      user: this.toPublicUser(user),
    };
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
    authUser: AuthUser,
  ): Promise<{ user: PublicUser }> {
    const isAdmin = authUser.role === 'ADMIN';
    const isOwner = authUser.sub === id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const user = await this.usersRepository.updateById(id, {
      name: updateUserDto.name,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user: this.toPublicUser(user),
    };
  }

  async deleteUser(id: number): Promise<{ success: true }> {
    const isDeleted = await this.usersRepository.softDeleteById(id);

    if (!isDeleted) {
      throw new NotFoundException('User not found');
    }

    return { success: true };
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
