import { Injectable } from '@nestjs/common';
import { type Category } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';

export type ActiveCategory = Omit<Category, 'deletedAt'> & {
  deletedAt: null;
};

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: {
    skip: number;
    take: number;
    search?: string;
  }): Promise<ActiveCategory[]> {
    const { skip, take, search } = params;

    return this.prisma.category.findMany({
      where: {
        deletedAt: null,
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  slug: {
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
    }) as Promise<ActiveCategory[]>;
  }

  countActive(params: { search?: string }): Promise<number> {
    const { search } = params;

    return this.prisma.category.count({
      where: {
        deletedAt: null,
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  slug: {
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

  findById(id: number): Promise<ActiveCategory | null> {
    return this.prisma.category.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    }) as Promise<ActiveCategory | null>;
  }

  findByName(name: string): Promise<ActiveCategory | null> {
    return this.prisma.category.findFirst({
      where: {
        name,
        deletedAt: null,
      },
    }) as Promise<ActiveCategory | null>;
  }

  findBySlug(slug: string): Promise<ActiveCategory | null> {
    return this.prisma.category.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
    }) as Promise<ActiveCategory | null>;
  }

  create(data: { name: string; slug: string }): Promise<ActiveCategory> {
    return this.prisma.category.create({
      data,
    }) as Promise<ActiveCategory>;
  }

  updateById(
    id: number,
    data: {
      name?: string;
      slug?: string;
    },
  ): Promise<ActiveCategory | null> {
    return this.prisma.category
      .updateManyAndReturn({
        where: {
          id,
          deletedAt: null,
        },
        data,
      })
      .then(
        (categories) => (categories[0] as ActiveCategory | undefined) ?? null,
      );
  }

  countActivePostsByCategoryId(categoryId: number): Promise<number> {
    return this.prisma.post.count({
      where: {
        categoryId,
        deletedAt: null,
      },
    });
  }

  async softDeleteById(id: number): Promise<boolean> {
    const result = await this.prisma.category.updateMany({
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
