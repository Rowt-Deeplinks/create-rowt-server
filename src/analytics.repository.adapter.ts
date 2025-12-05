import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InteractionEntity } from '../links/interaction.entity';
import { LinkEntity } from '../links/link.entity';
import { ProjectEntity } from '../projects/project.entity';
import { AnalyticsRepositoryPort } from './analytics.repository.port';
import { AnalyticsQuery } from './dto/analytics-query.dto';
import {
  AnalyticsResponse,
  AnalyticsSummary,
  AggregatedCount,
  TimeSeriesDataPoint,
  LinkAggregation,
} from './dto/analytics-response.dto';

@Injectable()
export class AnalyticsRepositoryAdapter implements AnalyticsRepositoryPort {
  constructor(
    @InjectRepository(InteractionEntity)
    private readonly interactionRepository: Repository<InteractionEntity>,
    @InjectRepository(LinkEntity)
    private readonly linkRepository: Repository<LinkEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
  ) {}

  async validateProjectAccess(
    projectId: string,
    userId: string,
  ): Promise<boolean> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      return false;
    }

    return project.userId === userId;
  }

  async getAnalytics(query: AnalyticsQuery): Promise<AnalyticsResponse> {
    const topN = Math.min(query.options?.topN || 10, 100);
    const granularity = this.determineGranularity(
      query.startDate,
      query.endDate,
    );

    // Build filter parameters
    const [filterConditions, params] = this.buildFilterParams(query);
    const baseParams = [
      query.projectId,
      query.startDate.toISOString(),
      query.endDate.toISOString(),
    ];
    const allParams = [...baseParams, ...params];

    // Build base CTE
    const baseCTE = `
      WITH filtered_interactions AS (
        SELECT
          i.id,
          i.timestamp,
          i.country,
          i.city,
          i.device,
          i.os,
          i.browser,
          i.referer,
          i.utm_source,
          i.utm_medium,
          i.utm_campaign,
          i.ip,
          l.id as link_id,
          l.title as link_title,
          l.url as link_url
        FROM interactions i
        INNER JOIN links l ON i.link_id = l.id
        WHERE l.project_id = $1
          AND i.timestamp >= $2
          AND i.timestamp <= $3
          ${filterConditions.join(' ')}
      )
    `;

    // Execute all aggregations in parallel
    const [
      totalCount,
      uniqueVisitors,
      timeSeries,
      topLinks,
      topDestinations,
      topReferrers,
      topCountries,
      topCities,
      linkTypes,
      topOS,
      topBrowsers,
      topDevices,
      topUtmSources,
      topUtmMediums,
      topUtmCampaigns,
    ] = await Promise.all([
      this.getTotalCount(baseCTE, allParams),
      this.getUniqueVisitors(baseCTE, allParams),
      this.executeTimeSeriesQuery(baseCTE, allParams, granularity, query.timezone || 'UTC'),
      this.executeLinkQuery(baseCTE, allParams, topN),
      this.executeDestinationQuery(baseCTE, allParams, topN),
      this.executeDimensionQuery(baseCTE, allParams, 'referer', topN),
      this.executeDimensionQuery(baseCTE, allParams, 'country', topN),
      this.executeDimensionQuery(baseCTE, allParams, 'city', topN),
      this.executeLinkTypeQuery(baseCTE, allParams),
      this.executeDimensionQuery(baseCTE, allParams, 'os', topN),
      this.executeDimensionQuery(baseCTE, allParams, 'browser', topN),
      this.executeDimensionQuery(baseCTE, allParams, 'device', topN),
      this.executeDimensionQuery(baseCTE, allParams, 'utm_source', topN),
      this.executeDimensionQuery(baseCTE, allParams, 'utm_medium', topN),
      this.executeDimensionQuery(baseCTE, allParams, 'utm_campaign', topN),
    ]);

    const summary: AnalyticsSummary = {
      totalInteractions: totalCount,
      uniqueVisitors,
      timeRange: this.calculateTimeRange(query.startDate, query.endDate),
    };

    return {
      query: {
        projectId: query.projectId,
        startDate: query.startDate,
        endDate: query.endDate,
        executedAt: new Date(),
        appliedFilters: query.filters,
      },
      summary,
      timeSeries: {
        granularity,
        data: timeSeries,
      },
      aggregations: {
        topDestinations,
        topLinks,
        topReferrers,
        topCountries,
        topCities,
        linkTypes,
        topOS,
        topBrowsers,
        topDevices,
        topUtmSources,
        topUtmMediums,
        topUtmCampaigns,
      },
    };
  }

  private buildFilterParams(query: AnalyticsQuery): [string[], any[]] {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 4;

    if (query.filters?.linkId) {
      conditions.push(`AND l.id = $${paramIndex++}`);
      params.push(query.filters.linkId);
    }

    if (query.filters?.destination) {
      conditions.push(`AND l.url = $${paramIndex++}`);
      params.push(query.filters.destination);
    }

    if (query.filters?.linkType === 'web') {
      conditions.push(`AND l.url LIKE 'https://%'`);
    } else if (query.filters?.linkType === 'deep') {
      conditions.push(`AND l.url LIKE '/%'`);
    }

    if (query.filters?.country) {
      conditions.push(`AND i.country = $${paramIndex++}`);
      params.push(query.filters.country);
    }

    if (query.filters?.city) {
      conditions.push(`AND i.city = $${paramIndex++}`);
      params.push(query.filters.city);
    }

    if (query.filters?.device) {
      conditions.push(`AND i.device = $${paramIndex++}`);
      params.push(query.filters.device);
    }

    if (query.filters?.os) {
      conditions.push(`AND i.os = $${paramIndex++}`);
      params.push(query.filters.os);
    }

    if (query.filters?.browser) {
      conditions.push(`AND i.browser = $${paramIndex++}`);
      params.push(query.filters.browser);
    }

    if (query.filters?.referer) {
      conditions.push(`AND i.referer = $${paramIndex++}`);
      params.push(query.filters.referer);
    }

    if (query.filters?.utmSource) {
      conditions.push(`AND i.utm_source = $${paramIndex++}`);
      params.push(query.filters.utmSource);
    }

    if (query.filters?.utmMedium) {
      conditions.push(`AND i.utm_medium = $${paramIndex++}`);
      params.push(query.filters.utmMedium);
    }

    if (query.filters?.utmCampaign) {
      conditions.push(`AND i.utm_campaign = $${paramIndex++}`);
      params.push(query.filters.utmCampaign);
    }

    return [conditions, params];
  }

  private determineGranularity(
    startDate: Date,
    endDate: Date,
  ): 'hour' | 'day' {
    const diffDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays < 2 ? 'hour' : 'day';
  }

  private async getTotalCount(cte: string, params: any[]): Promise<number> {
    const query = `
      ${cte}
      SELECT COUNT(*)::int as count FROM filtered_interactions
    `;
    const result = await this.interactionRepository.manager.query(
      query,
      params,
    );
    return result[0]?.count || 0;
  }

  private async getUniqueVisitors(
    cte: string,
    params: any[],
  ): Promise<number> {
    const query = `
      ${cte}
      SELECT COUNT(DISTINCT ip)::int as count
      FROM filtered_interactions
      WHERE ip IS NOT NULL
    `;
    const result = await this.interactionRepository.manager.query(
      query,
      params,
    );
    return result[0]?.count || 0;
  }

  private async executeTimeSeriesQuery(
    cte: string,
    params: any[],
    granularity: 'hour' | 'day',
    timezone: string,
  ): Promise<TimeSeriesDataPoint[]> {
    const truncFunc = granularity === 'hour' ? 'hour' : 'day';
    const labelFormat =
      granularity === 'hour' ? 'HH12:00am' : 'Mon DD';
    const interval = granularity === 'hour' ? '1 hour' : '1 day';

    const query = `
      WITH time_series AS (
        SELECT generate_series(
          date_trunc('${truncFunc}', $2::timestamp AT TIME ZONE 'UTC' AT TIME ZONE '${timezone}'),
          date_trunc('${truncFunc}', $3::timestamp AT TIME ZONE 'UTC' AT TIME ZONE '${timezone}'),
          '${interval}'::interval
        ) as bucket
      ),
      ${cte.replace('WITH filtered_interactions AS', 'filtered_interactions AS')}
      SELECT
        ts.bucket AT TIME ZONE '${timezone}' AT TIME ZONE 'UTC' AS timestamp,
        COALESCE(COUNT(fi.id), 0)::int as count,
        to_char(ts.bucket, '${labelFormat}') as label
      FROM time_series ts
      LEFT JOIN filtered_interactions fi
        ON date_trunc('${truncFunc}', fi.timestamp AT TIME ZONE 'UTC' AT TIME ZONE '${timezone}') = ts.bucket
      GROUP BY ts.bucket
      ORDER BY ts.bucket
    `;

    const results = await this.interactionRepository.manager.query(
      query,
      params,
    );

    return results.map((row: any) => ({
      timestamp: new Date(row.timestamp),
      count: row.count,
      label: row.label,
    }));
  }

  private async executeDimensionQuery(
    cte: string,
    params: any[],
    dimension: string,
    topN: number,
  ): Promise<AggregatedCount[]> {
    const query = `
      ${cte}
      SELECT
        COALESCE(NULLIF(${dimension}, ''), 'Unknown') as value,
        COUNT(*)::int as count,
        ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM filtered_interactions)::numeric * 100), 2) as percentage
      FROM filtered_interactions
      GROUP BY ${dimension}
      HAVING COALESCE(NULLIF(${dimension}, ''), 'Unknown') != ''
      ORDER BY count DESC
      LIMIT ${topN}
    `;

    const results = await this.interactionRepository.manager.query(
      query,
      params,
    );

    return results.map((row: any) => ({
      value: row.value,
      count: row.count,
      percentage: parseFloat(row.percentage),
    }));
  }

  private async executeDestinationQuery(
    cte: string,
    params: any[],
    topN: number,
  ): Promise<AggregatedCount[]> {
    const query = `
      ${cte}
      SELECT
        REGEXP_REPLACE(link_url, '^https?://', '') as value,
        COUNT(*)::int as count,
        ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM filtered_interactions)::numeric * 100), 2) as percentage
      FROM filtered_interactions
      WHERE link_url IS NOT NULL AND link_url != ''
      GROUP BY link_url
      ORDER BY count DESC
      LIMIT ${topN}
    `;

    const results = await this.interactionRepository.manager.query(
      query,
      params,
    );

    return results.map((row: any) => ({
      value: row.value,
      count: row.count,
      percentage: parseFloat(row.percentage),
    }));
  }

  private async executeLinkQuery(
    cte: string,
    params: any[],
    topN: number,
  ): Promise<LinkAggregation[]> {
    const query = `
      ${cte}
      SELECT
        link_id as value,
        MAX(link_title) as link_title,
        MAX(link_url) as link_url,
        COUNT(*)::int as count,
        ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM filtered_interactions)::numeric * 100), 2) as percentage
      FROM filtered_interactions
      WHERE link_id IS NOT NULL
      GROUP BY link_id
      ORDER BY count DESC
      LIMIT ${topN}
    `;

    const results = await this.interactionRepository.manager.query(
      query,
      params,
    );

    return results.map((row: any) => ({
      value: row.value,
      linkTitle: row.link_title,
      linkUrl: row.link_url,
      count: row.count,
      percentage: parseFloat(row.percentage),
    }));
  }

  private async executeLinkTypeQuery(
    cte: string,
    params: any[],
  ): Promise<AggregatedCount[]> {
    const query = `
      ${cte}
      SELECT
        CASE
          WHEN link_url LIKE 'https://%' THEN 'Web Links'
          WHEN link_url LIKE '/%' THEN 'Deep Links'
          ELSE 'Other'
        END as value,
        COUNT(*)::int as count,
        ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM filtered_interactions)::numeric * 100), 2) as percentage
      FROM filtered_interactions
      GROUP BY
        CASE
          WHEN link_url LIKE 'https://%' THEN 'Web Links'
          WHEN link_url LIKE '/%' THEN 'Deep Links'
          ELSE 'Other'
        END
      ORDER BY count DESC
    `;

    const results = await this.interactionRepository.manager.query(
      query,
      params,
    );

    return results.map((row: any) => ({
      value: row.value,
      count: row.count,
      percentage: parseFloat(row.percentage),
    }));
  }

  private calculateTimeRange(startDate: Date, endDate: Date): string {
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (days === 1) return '1 day';
    if (days <= 7) return `${days} days`;
    if (days <= 30) return `${days} days`;
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month' : `${months} months`;
  }
}
