import { Module, forwardRef } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { CategoriesModule } from '../categories/categories.module';
import { PostsController } from './posts.controller';
import { PostsRepository } from './posts.repository';
import { PostsService } from './posts.service';

@Module({
  imports: [forwardRef(() => AuthModule), CategoriesModule],
  controllers: [PostsController],
  providers: [PostsRepository, PostsService, RolesGuard],
  exports: [PostsService],
})
export class PostsModule {}
