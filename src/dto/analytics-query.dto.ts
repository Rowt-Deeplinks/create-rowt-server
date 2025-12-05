export interface AnalyticsQuery {
  projectId: string;
  startDate: Date;
  endDate: Date;
  timezone?: string; // e.g., "America/Los_Angeles", defaults to UTC
  filters?: {
    linkId?: string;
    destination?: string;
    linkType?: 'web' | 'deep';
    country?: string;
    city?: string;
    device?: string;
    os?: string;
    browser?: string;
    referer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
  options?: {
    topN?: number; // default 10, max 100
  };
}
