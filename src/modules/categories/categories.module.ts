import { Module, forwardRef } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { CategoriesController } from './categories.controller';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [CategoriesController],
  providers: [CategoriesRepository, CategoriesService, RolesGuard],
  exports: [CategoriesService],
})
export class CategoriesModule {}
