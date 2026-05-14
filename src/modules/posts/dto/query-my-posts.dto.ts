import { OmitType } from '@nestjs/swagger';
import { QueryAdminPostsDto } from './query-admin-posts.dto';

export class QueryMyPostsDto extends OmitType(QueryAdminPostsDto, [
  'user_id',
] as const) {}
