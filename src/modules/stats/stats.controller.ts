import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { QueryTopAuthorsDto } from './dto/query-top-authors.dto';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('top-published-authors')
  @Roles(Role.ADMIN)
  getTopPublishedAuthors(@Query() queryTopAuthorsDto: QueryTopAuthorsDto) {
    return this.statsService.getTopPublishedAuthors(queryTopAuthorsDto);
  }
}
