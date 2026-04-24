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
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  findUsers(@Query() queryUsersDto: QueryUsersDto) {
    return this.usersService.findUsers(queryUsersDto);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getPublicUserById(id);
  }

  @Patch(':id')
  @Roles(Role.USER, Role.ADMIN)
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.usersService.updateUser(id, updateUserDto, authUser);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }
}
