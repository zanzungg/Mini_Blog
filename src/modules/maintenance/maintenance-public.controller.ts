import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';

@Controller('maintenance')
@ApiTags('Maintenance')
export class MaintenancePublicController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get maintenance status (public)' })
  getStatus() {
    return this.maintenanceService.getMaintenanceConfig();
  }
}
