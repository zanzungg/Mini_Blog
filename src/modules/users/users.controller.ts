import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { type AuthUser } from '../auth/types/auth-user.type';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (admin only)' })
  @Roles(Role.ADMIN)
  findUsers(@Query() queryUsersDto: QueryUsersDto) {
    return this.usersService.findUsers(queryUsersDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public user by id (admin only)' })
  @Roles(Role.ADMIN)
  findUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getPublicUserById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user (self or admin)' })
  @Roles(Role.USER, Role.ADMIN)
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.usersService.updateUser(id, updateUserDto, authUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  @Roles(Role.ADMIN)
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }
}
