import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type AuthUser } from '../auth/types/auth-user.type';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  type ActivePost,
  type ActivePostWithRelations,
  PostsRepository,
} from './posts.repository';
import { CategoriesService } from '../categories/categories.service';

type PublicPost = {
  id: number;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  authorId: number;
  categoryId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type PublicPostWithRelations = PublicPost & {
  author: {
    id: number;
    email: string;
    name: string | null;
  };
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
};

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly categoriesService: CategoriesService,
  ) {}

  async createPost(
    createPostDto: CreatePostDto,
    authUser: AuthUser,
  ): Promise<{ post: PublicPost }> {
    if (createPostDto.categoryId !== undefined) {
      await this.categoriesService.findByIdOrThrow(createPostDto.categoryId);
    }

    const slug = await this.generateUniqueSlug(createPostDto.title);

    const post = await this.postsRepository.create({
      title: createPostDto.title,
      slug,
      content: createPostDto.content,
      authorId: authUser.sub,
      categoryId: createPostDto.categoryId,
    });

    return {
      post: this.toPublicPost(post),
    };
  }

  async findPosts(queryPostsDto: QueryPostsDto): Promise<{
    data: PublicPostWithRelations[];
    meta: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    const page = queryPostsDto.page ?? 1;
    const limit = queryPostsDto.limit ?? 10;
    const skip = (page - 1) * limit;

    const [posts, totalItems] = await Promise.all([
      this.postsRepository.findMany({
        skip,
        take: limit,
        status: queryPostsDto.status,
        userId: queryPostsDto.user_id,
        categoryId: queryPostsDto.category_id,
        keyword: queryPostsDto.keyword,
      }),
      this.postsRepository.countActive({
        status: queryPostsDto.status,
        userId: queryPostsDto.user_id,
        categoryId: queryPostsDto.category_id,
        keyword: queryPostsDto.keyword,
      }),
    ]);

    return {
      data: posts.map((post) => this.toPublicPostWithRelations(post)),
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async getPostDetail(id: number): Promise<{ post: PublicPostWithRelations }> {
    const post = await this.postsRepository.findByIdWithRelations(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      post: this.toPublicPostWithRelations(post),
    };
  }

  async updatePost(
    id: number,
    updatePostDto: UpdatePostDto,
    authUser: AuthUser,
  ): Promise<{ post: PublicPost }> {
    const currentPost = await this.postsRepository.findById(id);

    if (!currentPost) {
      throw new NotFoundException('Post not found');
    }

    this.ensurePostOwnerOrAdmin(currentPost, authUser);

    if (currentPost.published) {
      throw new BadRequestException('Published post cannot be updated');
    }

    if (
      updatePostDto.categoryId !== undefined &&
      updatePostDto.categoryId !== null
    ) {
      await this.categoriesService.findByIdOrThrow(updatePostDto.categoryId);
    }

    const slug = updatePostDto.title
      ? await this.generateUniqueSlug(updatePostDto.title, currentPost.id)
      : undefined;

    const post = await this.postsRepository.updateById(id, {
      ...(updatePostDto.title !== undefined
        ? {
            title: updatePostDto.title,
          }
        : {}),
      ...(slug !== undefined
        ? {
            slug,
          }
        : {}),
      ...(updatePostDto.content !== undefined
        ? {
            content: updatePostDto.content,
          }
        : {}),
      ...(updatePostDto.categoryId !== undefined
        ? {
            categoryId: updatePostDto.categoryId,
          }
        : {}),
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      post: this.toPublicPost(post),
    };
  }

  async deletePost(id: number, authUser: AuthUser): Promise<{ success: true }> {
    const post = await this.postsRepository.findById(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    this.ensurePostOwnerOrAdmin(post, authUser);

    const isDeleted = await this.postsRepository.softDeleteById(id);

    if (!isDeleted) {
      throw new NotFoundException('Post not found');
    }

    return { success: true };
  }

  async publishPost(
    id: number,
    authUser: AuthUser,
  ): Promise<{ post: PublicPost }> {
    const currentPost = await this.postsRepository.findById(id);

    if (!currentPost) {
      throw new NotFoundException('Post not found');
    }

    this.ensurePostOwnerOrAdmin(currentPost, authUser);

    if (!currentPost.title.trim() || !currentPost.content.trim()) {
      throw new BadRequestException(
        'Post must have title and content before publishing',
      );
    }

    if (currentPost.published) {
      return {
        post: this.toPublicPost(currentPost),
      };
    }

    const post = await this.postsRepository.publishById(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      post: this.toPublicPost(post),
    };
  }

  private ensurePostOwnerOrAdmin(post: ActivePost, authUser: AuthUser): void {
    const isAdmin = authUser.role === 'ADMIN';
    const isOwner = post.authorId === authUser.sub;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only manage your own posts');
    }
  }

  private toPublicPost(post: ActivePost): PublicPost {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      published: post.published,
      authorId: post.authorId,
      categoryId: post.categoryId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  private toPublicPostWithRelations(
    post: ActivePostWithRelations,
  ): PublicPostWithRelations {
    return {
      ...this.toPublicPost(post),
      author: {
        id: post.author.id,
        email: post.author.email,
        name: post.author.name,
      },
      category: post.category
        ? {
            id: post.category.id,
            name: post.category.name,
            slug: post.category.slug,
          }
        : null,
    };
  }

  private async generateUniqueSlug(
    title: string,
    excludedPostId?: number,
  ): Promise<string> {
    const baseSlug = this.toSlug(title);
    let candidateSlug = baseSlug;
    let suffix = 1;

    while (true) {
      const existingPost = await this.postsRepository.findBySlug(candidateSlug);

      if (!existingPost || existingPost.id === excludedPostId) {
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

    return slug || `post-${Date.now()}`;
  }
}
