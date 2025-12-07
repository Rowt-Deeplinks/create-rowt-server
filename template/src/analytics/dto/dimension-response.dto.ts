import { AggregatedCount, LinkAggregation } from './analytics-response.dto';

export interface DimensionQueryMetadata {
  projectId: string;
  dimension: string;
  startDate: Date;
  endDate: Date;
  executedAt: Date;
  appliedFilters?: any;
}

export interface PaginationMetadata {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface DimensionResponse {
  query: DimensionQueryMetadata;
  dimension: string;
  items: (AggregatedCount | LinkAggregation)[];
  pagination: PaginationMetadata;
}
