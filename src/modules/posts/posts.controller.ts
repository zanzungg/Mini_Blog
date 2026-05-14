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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { type AuthUser } from '../auth/types/auth-user.type';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { QueryAdminPostsDto } from './dto/query-admin-posts.dto';
import { QueryMyPostsDto } from './dto/query-my-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
@ApiTags('Posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
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

  @Get('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] List all posts with filters' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAllPostsAdmin(@Query() queryPostsDto: QueryAdminPostsDto) {
    return this.postsService.findAllPostsAdmin(queryPostsDto);
  }

  @Get('admin/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Get any post detail including draft' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getPostDetailAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostDetailAdmin(id);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my posts with search, filter, and pagination' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  findMyPosts(
    @Query() queryMyPostsDto: QueryMyPostsDto,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.postsService.findMyPosts(queryMyPostsDto, authUser);
  }

  @Get(':id')
  getPostDetail(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostDetail(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a draft post' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  publishPost(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.postsService.publishPost(id, authUser);
  }

  @Post('full-create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a post with full related data' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  fullCreatePost(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.postsService.createFullPost(createPostDto, authUser);
  }
}
