import { OmitType } from '@nestjs/swagger';
import { QueryPostsDto } from './query-posts.dto';

export class QueryMyPostsDto extends OmitType(QueryPostsDto, [
  'user_id',
] as const) {}
