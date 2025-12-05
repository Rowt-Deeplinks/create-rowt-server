import { Injectable, Inject } from '@nestjs/common';
import { AnalyticsRepositoryPort } from './analytics.repository.port';
import { AnalyticsQuery } from './dto/analytics-query.dto';
import { AnalyticsResponse } from './dto/analytics-response.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(AnalyticsRepositoryPort)
    private readonly analyticsRepository: AnalyticsRepositoryPort,
  ) {}

  async getAnalytics(query: AnalyticsQuery): Promise<AnalyticsResponse> {
    return this.analyticsRepository.getAnalytics(query);
  }

  async validateProjectAccess(
    projectId: string,
    userId: string,
  ): Promise<boolean> {
    return this.analyticsRepository.validateProjectAccess(projectId, userId);
  }
}
