export interface DimensionQuery {
  projectId: string;
  dimension:
    | 'links'
    | 'countries'
    | 'cities'
    | 'devices'
    | 'os'
    | 'browsers'
    | 'referrers'
    | 'resolvedUrls'
    | 'utmSources'
    | 'utmMediums'
    | 'utmCampaigns'
    | 'utmTerms'
    | 'utmContents';
  startDate: Date;
  endDate: Date;
  timezone?: string;
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
    utmTerm?: string;
    utmContent?: string;
    resolvedUrl?: string;
  };
  limit?: number; // default 50, max 500
  offset?: number; // default 0
}
