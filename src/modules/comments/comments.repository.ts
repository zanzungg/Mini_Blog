import { Injectable } from '@nestjs/common';
import { Prisma, type Comment, type Post } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';

export type ActiveComment = Omit<Comment, 'deletedAt'> & {
  deletedAt: null;
};

export type ActiveCommentWithRelations = Prisma.CommentGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        email: true;
        name: true;
      };
    };
    post: {
      select: {
        id: true;
        title: true;
        slug: true;
      };
    };
  };
}> & {
  deletedAt: null;
};

export type ActivePost = Omit<Post, 'deletedAt'> & {
  deletedAt: null;
};

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    content: string;
    postId: number;
    userId: number;
    parentId?: number;
  }): Promise<ActiveComment> {
    return this.prisma.comment.create({
      data,
    }) as Promise<ActiveComment>;
  }

  findById(id: number): Promise<ActiveComment | null> {
    return this.prisma.comment.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    }) as Promise<ActiveComment | null>;
  }

  findByIdWithRelations(
    id: number,
  ): Promise<ActiveCommentWithRelations | null> {
    return this.prisma.comment.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    }) as Promise<ActiveCommentWithRelations | null>;
  }

  findMany(params: {
    skip: number;
    take: number;
    postId?: number;
    userId?: number;
    parentId?: number;
    keyword?: string;
  }): Promise<ActiveCommentWithRelations[]> {
    const { skip, take, postId, userId, parentId, keyword } = params;

    return this.prisma.comment.findMany({
      where: {
        deletedAt: null,
        postId,
        userId,
        parentId,
        ...(keyword
          ? {
              content: {
                contains: keyword,
                mode: 'insensitive',
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    }) as Promise<ActiveCommentWithRelations[]>;
  }

  findAllByPostId(postId: number): Promise<ActiveCommentWithRelations[]> {
    return this.prisma.comment.findMany({
      where: {
        deletedAt: null,
        postId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) as Promise<ActiveCommentWithRelations[]>;
  }

  countActive(params: {
    postId?: number;
    userId?: number;
    parentId?: number;
    keyword?: string;
  }): Promise<number> {
    const { postId, userId, parentId, keyword } = params;

    return this.prisma.comment.count({
      where: {
        deletedAt: null,
        postId,
        userId,
        parentId,
        ...(keyword
          ? {
              content: {
                contains: keyword,
                mode: 'insensitive',
              },
            }
          : {}),
      },
    });
  }

  updateById(
    id: number,
    data: Prisma.CommentUpdateManyMutationInput,
  ): Promise<ActiveComment | null> {
    return this.prisma.comment
      .updateManyAndReturn({
        where: {
          id,
          deletedAt: null,
        },
        data,
      })
      .then((comments) => (comments[0] as ActiveComment | undefined) ?? null);
  }

  async softDeleteById(id: number): Promise<boolean> {
    const result = await this.prisma.comment.updateMany({
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

  findActivePostById(postId: number): Promise<ActivePost | null> {
    return this.prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
    }) as Promise<ActivePost | null>;
  }
}
