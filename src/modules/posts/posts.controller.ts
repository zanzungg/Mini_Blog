import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { type AuthUser } from '../auth/types/auth-user.type';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  createPost(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.postsService.createPost(createPostDto, authUser);
  }

  @Get()
  findPosts(@Query() queryPostsDto: QueryPostsDto) {
    return this.postsService.findPosts(queryPostsDto);
  }

  @Get(':id')
  getPostDetail(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostDetail(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.postsService.updatePost(id, updatePostDto, authUser);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  deletePost(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.postsService.deletePost(id, authUser);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  publishPost(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.postsService.publishPost(id, authUser);
  }
}
