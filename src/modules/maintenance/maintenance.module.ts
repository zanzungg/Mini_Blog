import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MaintenanceController } from './maintenance.controller';
import { MaintenancePublicController } from './maintenance-public.controller';
import { MaintenanceRepository } from './maintenance.repository';
import { MaintenanceService } from './maintenance.service';

@Module({
  imports: [AuthModule],
  controllers: [MaintenanceController, MaintenancePublicController],
  providers: [MaintenanceRepository, MaintenanceService, RolesGuard],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
