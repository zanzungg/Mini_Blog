import { Injectable } from '@nestjs/common';
import { Prisma, type Post } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';

export type ActivePost = Omit<Post, 'deletedAt'> & {
  deletedAt: null;
};

export type ActivePostWithRelations = Prisma.PostGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        email: true;
        name: true;
      };
    };
    category: {
      select: {
        id: true;
        name: true;
        slug: true;
      };
    };
  };
}> & {
  deletedAt: null;
};

@Injectable()
export class PostsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    title: string;
    slug: string;
    content: string;
    authorId: number;
    categoryId?: number | null;
  }): Promise<ActivePost> {
    return this.prisma.post.create({
      data,
    }) as Promise<ActivePost>;
  }

  findById(id: number): Promise<ActivePost | null> {
    return this.prisma.post.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    }) as Promise<ActivePost | null>;
  }

  findByIdWithRelations(id: number): Promise<ActivePostWithRelations | null> {
    return this.prisma.post.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }) as Promise<ActivePostWithRelations | null>;
  }

  findBySlug(slug: string): Promise<ActivePost | null> {
    return this.prisma.post.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
    }) as Promise<ActivePost | null>;
  }

  findMany(params: {
    skip: number;
    take: number;
    status?: 'draft' | 'published';
    userId?: number;
    categoryId?: number;
    keyword?: string;
  }): Promise<ActivePostWithRelations[]> {
    const { skip, take, status, userId, categoryId, keyword } = params;

    return this.prisma.post.findMany({
      where: this.buildWhereClause({ status, userId, categoryId, keyword }),
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    }) as Promise<ActivePostWithRelations[]>;
  }

  countActive(params: {
    status?: 'draft' | 'published';
    userId?: number;
    categoryId?: number;
    keyword?: string;
  }): Promise<number> {
    const { status, userId, categoryId, keyword } = params;

    return this.prisma.post.count({
      where: this.buildWhereClause({ status, userId, categoryId, keyword }),
    });
  }

  updateById(
    id: number,
    data: Prisma.PostUpdateManyMutationInput,
  ): Promise<ActivePost | null> {
    return this.prisma.post
      .updateManyAndReturn({
        where: {
          id,
          deletedAt: null,
        },
        data,
      })
      .then((posts) => (posts[0] as ActivePost | undefined) ?? null);
  }

  publishById(id: number): Promise<ActivePost | null> {
    return this.prisma.post
      .updateManyAndReturn({
        where: {
          id,
          deletedAt: null,
        },
        data: {
          published: true,
        },
      })
      .then((posts) => (posts[0] as ActivePost | undefined) ?? null);
  }

  async softDeleteById(id: number): Promise<boolean> {
    const result = await this.prisma.post.updateMany({
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

  private buildWhereClause(params: {
    status?: 'draft' | 'published';
    userId?: number;
    categoryId?: number;
    keyword?: string;
  }): Prisma.PostWhereInput {
    const { status, userId, categoryId, keyword } = params;

    return {
      deletedAt: null,
      authorId: userId,
      categoryId,
      ...(status
        ? {
            published: status === 'published',
          }
        : {}),
      ...(keyword
        ? {
            title: {
              contains: keyword,
              mode: 'insensitive',
            },
          }
        : {}),
    };
  }
}
