import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InteractionEntity } from '../links/interaction.entity';
import { LinkEntity } from '../links/link.entity';
import { ProjectEntity } from '../projects/project.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepositoryPort } from './analytics.repository.port';
import { AnalyticsRepositoryAdapter } from './analytics.repository.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([InteractionEntity, LinkEntity, ProjectEntity]),
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    {
      provide: AnalyticsRepositoryPort,
      useClass: AnalyticsRepositoryAdapter,
    },
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
