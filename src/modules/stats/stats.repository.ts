import { Injectable } from '@nestjs/common';
import { type Role } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';

export type TopPublishedAuthorRow = {
  user: {
    id: number;
    email: string;
    name: string | null;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
  };
  publishedPostCount: number;
};

@Injectable()
export class StatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTopPublishedAuthors(
    limit: number,
  ): Promise<TopPublishedAuthorRow[]> {
    const groupedPosts = await this.prisma.post.groupBy({
      by: ['authorId'],
      where: {
        deletedAt: null,
        published: true,
      },
      _count: {
        authorId: true,
      },
      orderBy: {
        _count: {
          authorId: 'desc',
        },
      },
      take: limit,
    });

    if (groupedPosts.length === 0) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        id: {
          in: groupedPosts.map((post) => post.authorId),
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const userById = new Map(users.map((user) => [user.id, user]));

    return groupedPosts
      .map((post) => {
        const user = userById.get(post.authorId);

        if (!user) {
          return null;
        }

        return {
          user,
          publishedPostCount: post._count.authorId,
        };
      })
      .filter((row): row is TopPublishedAuthorRow => row !== null);
  }
}
