import { Injectable } from '@nestjs/common';
import { QueryTopAuthorsDto } from './dto/query-top-authors.dto';
import {
  StatsRepository,
  type TopPublishedAuthorRow,
} from './stats.repository';

@Injectable()
export class StatsService {
  constructor(private readonly statsRepository: StatsRepository) {}

  async getTopPublishedAuthors(
    queryTopAuthorsDto: QueryTopAuthorsDto,
  ): Promise<{
    data: TopPublishedAuthorRow[];
    meta: {
      limit: number;
      totalItems: number;
    };
  }> {
    const limit = queryTopAuthorsDto.limit ?? 5;
    const data = await this.statsRepository.findTopPublishedAuthors(limit);

    return {
      data,
      meta: {
        limit,
        totalItems: data.length,
      },
    };
  }
}
