import { AnalyticsQuery } from './dto/analytics-query.dto';
import { AnalyticsResponse } from './dto/analytics-response.dto';
import { DimensionQuery } from './dto/dimension-query.dto';
import { DimensionResponse } from './dto/dimension-response.dto';

export abstract class AnalyticsRepositoryPort {
  abstract getAnalytics(query: AnalyticsQuery): Promise<AnalyticsResponse>;
  abstract getDimensionBreakdown(
    query: DimensionQuery,
  ): Promise<DimensionResponse>;
  abstract validateProjectAccess(
    projectId: string,
    userId: string,
  ): Promise<boolean>;
}
