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

export interface AnalyticsResponse {
  query: AnalyticsQueryMetadata;
  summary: AnalyticsSummary;
  timeSeries: {
    granularity: 'hour' | 'day';
    data: TimeSeriesDataPoint[];
  };
  aggregations: {
    topDestinations: AggregatedCount[];
    topLinks: LinkAggregation[];
    topReferrers: AggregatedCount[];
    topCountries: AggregatedCount[];
    topCities: AggregatedCount[];
    linkTypes: AggregatedCount[];
    topOS: AggregatedCount[];
    topBrowsers: AggregatedCount[];
    topDevices: AggregatedCount[];
    topUtmSources: AggregatedCount[];
    topUtmMediums: AggregatedCount[];
    topUtmCampaigns: AggregatedCount[];
  };
}
