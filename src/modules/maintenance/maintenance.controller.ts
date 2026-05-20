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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AddMaintenanceIpDto } from './dto/add-maintenance-ip.dto';
import { AddMaintenanceUserDto } from './dto/add-maintenance-user.dto';
import { QueryMaintenanceIpsDto } from './dto/query-maintenance-ips.dto';
import { QueryMaintenanceUsersDto } from './dto/query-maintenance-users.dto';
import { UpdateMaintenanceConfigDto } from './dto/update-maintenance-config.dto';
import { MaintenanceService } from './maintenance.service';

@Controller('maintenance')
@ApiTags('Maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('config')
  @ApiOperation({ summary: '[ADMIN] Get maintenance config' })
  getConfig() {
    return this.maintenanceService.getMaintenanceConfig();
  }

  @Patch('config')
  @ApiOperation({ summary: '[ADMIN] Update maintenance config' })
  updateConfig(@Body() updateMaintenanceConfigDto: UpdateMaintenanceConfigDto) {
    return this.maintenanceService.updateMaintenanceConfig(
      updateMaintenanceConfigDto,
    );
  }

  @Get('whitelist/users')
  @ApiOperation({ summary: '[ADMIN] List maintenance users' })
  listUsers(@Query() queryMaintenanceUsersDto: QueryMaintenanceUsersDto) {
    return this.maintenanceService.listMaintenanceUsers(
      queryMaintenanceUsersDto,
    );
  }

  @Post('whitelist/users')
  @ApiOperation({ summary: '[ADMIN] Add maintenance user' })
  addUser(@Body() addMaintenanceUserDto: AddMaintenanceUserDto) {
    return this.maintenanceService.addMaintenanceUserByEmail(
      addMaintenanceUserDto.email,
    );
  }

  @Delete('whitelist/users/:userId')
  @ApiOperation({ summary: '[ADMIN] Remove maintenance user' })
  removeUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.maintenanceService.removeMaintenanceUser(userId);
  }

  @Get('whitelist/ips')
  @ApiOperation({ summary: '[ADMIN] List maintenance IPs' })
  listIps(@Query() queryMaintenanceIpsDto: QueryMaintenanceIpsDto) {
    return this.maintenanceService.listMaintenanceIps(queryMaintenanceIpsDto);
  }

  @Post('whitelist/ips')
  @ApiOperation({ summary: '[ADMIN] Add maintenance IP' })
  addIp(@Body() addMaintenanceIpDto: AddMaintenanceIpDto) {
    return this.maintenanceService.addMaintenanceIp(addMaintenanceIpDto.ip);
  }

  @Delete('whitelist/ips/:ip')
  @ApiOperation({ summary: '[ADMIN] Remove maintenance IP' })
  removeIp(@Param('ip') ip: string) {
    return this.maintenanceService.removeMaintenanceIp(ip);
  }
}
