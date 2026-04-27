import { Module, forwardRef } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { CommentsController } from './comments.controller';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [CommentsController],
  providers: [CommentsRepository, CommentsService, RolesGuard],
  exports: [CommentsService],
})
export class CommentsModule {}
