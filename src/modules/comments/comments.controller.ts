import {
  Body,
  Controller,
  Delete,
  Get,
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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentsDto } from './dto/query-comments.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  createComment(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.commentsService.createComment(createCommentDto, authUser);
  }

  @Get()
  findComments(@Query() queryCommentsDto: QueryCommentsDto) {
    return this.commentsService.findComments(queryCommentsDto);
  }

  @Get(':id')
  getCommentDetail(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.getCommentDetail(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  updateComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.commentsService.updateComment(id, updateCommentDto, authUser);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  deleteComment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.commentsService.deleteComment(id, authUser);
  }
}
