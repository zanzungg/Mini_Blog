import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type AuthUser } from '../auth/types/auth-user.type';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentsDto } from './dto/query-comments.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import {
  type ActiveComment,
  type ActiveCommentWithRelations,
  CommentsRepository,
} from './comments.repository';

type PublicComment = {
  id: number;
  content: string;
  postId: number;
  userId: number;
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type PublicCommentWithRelations = PublicComment & {
  user: {
    id: number;
    email: string;
    name: string | null;
  };
  post: {
    id: number;
    title: string;
    slug: string;
  };
};

type PublicThreadedComment = PublicCommentWithRelations & {
  replies: PublicThreadedComment[];
};

@Injectable()
export class CommentsService {
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async createComment(
    createCommentDto: CreateCommentDto,
    authUser: AuthUser,
  ): Promise<{ comment: PublicComment }> {
    await this.ensurePostIsPublished(createCommentDto.postId);

    if (createCommentDto.parentId !== undefined) {
      const parentComment = await this.commentsRepository.findById(
        createCommentDto.parentId,
      );

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parentComment.postId !== createCommentDto.postId) {
        throw new BadRequestException(
          'Parent comment must belong to the same post',
        );
      }
    }

    const comment = await this.commentsRepository.create({
      content: createCommentDto.content,
      postId: createCommentDto.postId,
      userId: authUser.userId,
      parentId: createCommentDto.parentId,
    });

    return {
      comment: this.toPublicComment(comment),
    };
  }

  async findComments(queryCommentsDto: QueryCommentsDto): Promise<{
    data: PublicThreadedComment[];
    meta: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    const page = queryCommentsDto.page ?? 1;
    const limit = queryCommentsDto.limit ?? 10;
    const skip = (page - 1) * limit;

    if (queryCommentsDto.post_id !== undefined) {
      await this.ensurePostExists(queryCommentsDto.post_id);

      const shouldReturnThreaded =
        queryCommentsDto.parent_id === undefined &&
        queryCommentsDto.user_id === undefined &&
        queryCommentsDto.keyword === undefined;

      if (shouldReturnThreaded) {
        const comments = await this.commentsRepository.findAllByPostId(
          queryCommentsDto.post_id,
        );

        const threadedComments = this.buildThreadedComments(
          comments.map((comment) => this.toPublicCommentWithRelations(comment)),
        );

        const totalItems = threadedComments.length;
        const pagedData = threadedComments.slice(skip, skip + limit);

        return {
          data: pagedData,
          meta: {
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
          },
        };
      }
    }

    const [comments, totalItems] = await Promise.all([
      this.commentsRepository.findMany({
        skip,
        take: limit,
        postId: queryCommentsDto.post_id,
        userId: queryCommentsDto.user_id,
        parentId: queryCommentsDto.parent_id,
        keyword: queryCommentsDto.keyword,
      }),
      this.commentsRepository.countActive({
        postId: queryCommentsDto.post_id,
        userId: queryCommentsDto.user_id,
        parentId: queryCommentsDto.parent_id,
        keyword: queryCommentsDto.keyword,
      }),
    ]);

    return {
      data: comments.map((comment) => this.toPublicThreadedComment(comment)),
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async getCommentDetail(
    id: number,
  ): Promise<{ comment: PublicCommentWithRelations }> {
    const comment = await this.commentsRepository.findByIdWithRelations(id);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return {
      comment: this.toPublicCommentWithRelations(comment),
    };
  }

  async updateComment(
    id: number,
    updateCommentDto: UpdateCommentDto,
    authUser: AuthUser,
  ): Promise<{ comment: PublicComment }> {
    const currentComment = await this.commentsRepository.findById(id);

    if (!currentComment) {
      throw new NotFoundException('Comment not found');
    }

    this.ensureCommentOwnerOrAdmin(currentComment, authUser);

    const comment = await this.commentsRepository.updateById(id, {
      content: updateCommentDto.content,
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return {
      comment: this.toPublicComment(comment),
    };
  }

  async deleteComment(
    id: number,
    authUser: AuthUser,
  ): Promise<{ success: true }> {
    const comment = await this.commentsRepository.findById(id);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    this.ensureCommentOwnerOrAdmin(comment, authUser);

    const isDeleted = await this.commentsRepository.softDeleteById(id);

    if (!isDeleted) {
      throw new NotFoundException('Comment not found');
    }

    return { success: true };
  }

  private ensureCommentOwnerOrAdmin(
    comment: ActiveComment,
    authUser: AuthUser,
  ): void {
    const isAdmin = authUser.role === 'ADMIN';
    const isOwner = comment.userId === authUser.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only manage your own comments');
    }
  }

  private async ensurePostExists(postId: number): Promise<void> {
    const post = await this.commentsRepository.findActivePostById(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }
  }

  private async ensurePostIsPublished(postId: number): Promise<void> {
    const post = await this.commentsRepository.findActivePostById(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (!post.published) {
      throw new BadRequestException('Cannot comment on draft post');
    }
  }

  private toPublicComment(comment: ActiveComment): PublicComment {
    return {
      id: comment.id,
      content: comment.content,
      postId: comment.postId,
      userId: comment.userId,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  private toPublicCommentWithRelations(
    comment: ActiveCommentWithRelations,
  ): PublicCommentWithRelations {
    return {
      ...this.toPublicComment(comment),
      user: {
        id: comment.user.id,
        email: comment.user.email,
        name: comment.user.name,
      },
      post: {
        id: comment.post.id,
        title: comment.post.title,
        slug: comment.post.slug,
      },
    };
  }

  private toPublicThreadedComment(
    comment: ActiveCommentWithRelations,
  ): PublicThreadedComment {
    return {
      ...this.toPublicCommentWithRelations(comment),
      replies: [],
    };
  }

  private buildThreadedComments(
    comments: PublicCommentWithRelations[],
  ): PublicThreadedComment[] {
    const nodeById = new Map<number, PublicThreadedComment>();

    for (const comment of comments) {
      nodeById.set(comment.id, {
        ...comment,
        replies: [],
      });
    }

    const roots: PublicThreadedComment[] = [];

    for (const node of nodeById.values()) {
      if (node.parentId === null) {
        roots.push(node);
        continue;
      }

      const parent = nodeById.get(node.parentId);

      if (!parent) {
        roots.push(node);
        continue;
      }

      parent.replies.push(node);
    }

    return roots;
  }
}
