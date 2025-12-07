export interface AggregatedCount {
  value: string;
  count: number;
  percentage: number;
}

export interface TimeSeriesDataPoint {
  timestamp: Date;
  count: number;
  label: string;
}

export interface LinkAggregation extends AggregatedCount {
  linkTitle: string | null;
  linkUrl: string;
}

export interface AnalyticsSummary {
  totalInteractions: number;
  uniqueVisitors: number;
  timeRange: string;
}

export interface AnalyticsQueryMetadata {
  projectId: string;
  startDate: Date;
  endDate: Date;
  executedAt: Date;
  appliedFilters?: any;
}

export interface AggregationResult<T = AggregatedCount> {
  items: T[];
  hasMore: boolean;
}

export interface AnalyticsResponse {
  query: AnalyticsQueryMetadata;
  summary: AnalyticsSummary;
  timeSeries: {
    granularity: 'hour' | 'day';
    data: TimeSeriesDataPoint[];
  };
  aggregations: {
    topDestinations: AggregationResult;
    topLinks: AggregationResult<LinkAggregation>;
    topReferrers: AggregationResult;
    topCountries: AggregationResult;
    topCities: AggregationResult;
    linkTypes: AggregationResult;
    topOS: AggregationResult;
    topBrowsers: AggregationResult;
    topDevices: AggregationResult;
    topUtmSources: AggregationResult;
    topUtmMediums: AggregationResult;
    topUtmCampaigns: AggregationResult;
    topUtmTerms: AggregationResult;
    topUtmContents: AggregationResult;
    topResolvedUrls: AggregationResult;
  };
}
