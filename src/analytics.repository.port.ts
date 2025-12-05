import { AnalyticsQuery } from './dto/analytics-query.dto';
import { AnalyticsResponse } from './dto/analytics-response.dto';

export abstract class AnalyticsRepositoryPort {
  abstract getAnalytics(query: AnalyticsQuery): Promise<AnalyticsResponse>;
  abstract validateProjectAccess(
    projectId: string,
    userId: string,
  ): Promise<boolean>;
}
