import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  type ActiveCategory,
  CategoriesRepository,
} from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export type PublicCategory = {
  id: number;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async findCategories(queryCategoriesDto: QueryCategoriesDto): Promise<{
    data: PublicCategory[];
    meta: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    const page = queryCategoriesDto.page ?? 1;
    const limit = queryCategoriesDto.limit ?? 10;
    const skip = (page - 1) * limit;

    const [categories, totalItems] = await Promise.all([
      this.categoriesRepository.findMany({
        skip,
        take: limit,
        search: queryCategoriesDto.search,
      }),
      this.categoriesRepository.countActive({
        search: queryCategoriesDto.search,
      }),
    ]);

    return {
      data: categories.map((category) => this.toPublicCategory(category)),
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async getCategoryById(id: number): Promise<{ category: PublicCategory }> {
    const category = await this.findByIdOrThrow(id);

    return {
      category: this.toPublicCategory(category),
    };
  }

  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<{ category: PublicCategory }> {
    const slug = await this.generateUniqueSlug(createCategoryDto.name);

    const existingByName = await this.categoriesRepository.findByName(
      createCategoryDto.name,
    );

    if (existingByName) {
      throw new ConflictException('Category name already exists');
    }

    const category = await this.categoriesRepository.create({
      name: createCategoryDto.name,
      slug,
    });

    return {
      category: this.toPublicCategory(category),
    };
  }

  async updateCategory(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<{ category: PublicCategory }> {
    await this.findByIdOrThrow(id);

    if (updateCategoryDto.name !== undefined) {
      const existingByName = await this.categoriesRepository.findByName(
        updateCategoryDto.name,
      );

      if (existingByName && existingByName.id !== id) {
        throw new ConflictException('Category name already exists');
      }
    }

    const slug = updateCategoryDto.name
      ? await this.generateUniqueSlug(updateCategoryDto.name, id)
      : undefined;

    const category = await this.categoriesRepository.updateById(id, {
      ...(updateCategoryDto.name !== undefined
        ? {
            name: updateCategoryDto.name,
          }
        : {}),
      ...(slug !== undefined
        ? {
            slug,
          }
        : {}),
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      category: this.toPublicCategory(category),
    };
  }

  async deleteCategory(id: number): Promise<{ success: true }> {
    const activePostsCount =
      await this.categoriesRepository.countActivePostsByCategoryId(id);

    if (activePostsCount > 0) {
      throw new BadRequestException(
        'Cannot delete category that is assigned to active posts',
      );
    }

    const isDeleted = await this.categoriesRepository.softDeleteById(id);

    if (!isDeleted) {
      throw new NotFoundException('Category not found');
    }

    return { success: true };
  }

  async findByIdOrThrow(id: number): Promise<ActiveCategory> {
    const category = await this.categoriesRepository.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  toPublicCategory(category: ActiveCategory): PublicCategory {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  private async generateUniqueSlug(
    name: string,
    excludedCategoryId?: number,
  ): Promise<string> {
    const baseSlug = this.toSlug(name);
    let candidateSlug = baseSlug;
    let suffix = 1;

    while (true) {
      const existingCategory =
        await this.categoriesRepository.findBySlug(candidateSlug);

      if (!existingCategory || existingCategory.id === excludedCategoryId) {
        return candidateSlug;
      }

      suffix += 1;
      candidateSlug = `${baseSlug}-${suffix}`;
    }
  }

  private toSlug(value: string): string {
    const slug = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return slug || `category-${Date.now()}`;
  }
}
