import { Injectable, Inject } from '@nestjs/common';
import { AnalyticsRepositoryPort } from './analytics.repository.port';
import { AnalyticsQuery } from './dto/analytics-query.dto';
import { AnalyticsResponse } from './dto/analytics-response.dto';
import { DimensionQuery } from './dto/dimension-query.dto';
import { DimensionResponse } from './dto/dimension-response.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(AnalyticsRepositoryPort)
    private readonly analyticsRepository: AnalyticsRepositoryPort,
  ) {}

  async getAnalytics(query: AnalyticsQuery): Promise<AnalyticsResponse> {
    return this.analyticsRepository.getAnalytics(query);
  }

  async getDimensionBreakdown(
    query: DimensionQuery,
  ): Promise<DimensionResponse> {
    return this.analyticsRepository.getDimensionBreakdown(query);
  }

  async validateProjectAccess(
    projectId: string,
    userId: string,
  ): Promise<boolean> {
    return this.analyticsRepository.validateProjectAccess(projectId, userId);
  }
}
