import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQuery } from './dto/analytics-query.dto';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Throttle({ default: { limit: 20, ttl: 5000 } })
  @Get()
  async getAnalytics(
    @Query() queryParams: Record<string, any>,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      logger.info('Analytics query requested', {
        projectId: queryParams.projectId,
        userId: req.user?.userId,
      });

      // Parse query with filters and options
      const query: AnalyticsQuery = {
        projectId: queryParams.projectId,
        startDate: new Date(queryParams.startDate),
        endDate: new Date(queryParams.endDate),
        timezone: queryParams.timezone || 'UTC',
        filters: {
          linkId: queryParams.linkId,
          destination: queryParams.destination,
          linkType: queryParams.linkType as 'web' | 'deep' | undefined,
          country: queryParams.country,
          city: queryParams.city,
          device: queryParams.device,
          os: queryParams.os,
          browser: queryParams.browser,
          referer: queryParams.referer,
          utmSource: queryParams.utmSource,
          utmMedium: queryParams.utmMedium,
          utmCampaign: queryParams.utmCampaign,
        },
        options: {
          topN: queryParams.topN ? parseInt(queryParams.topN) : 10,
        },
      };

      // Validate required params
      if (!query.projectId || !query.startDate || !query.endDate) {
        res.status(400).json({
          message: 'projectId, startDate, and endDate are required',
        });
        return;
      }

      // Validate user has access to project
      const hasAccess = await this.analyticsService.validateProjectAccess(
        query.projectId,
        req.user?.userId || '',
      );

      if (!hasAccess) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }

      // Validate date range
      if (query.startDate >= query.endDate) {
        res.status(400).json({ message: 'startDate must be before endDate' });
        return;
      }

      // Execute analytics query
      const analytics = await this.analyticsService.getAnalytics(query);

      logger.info('Analytics query completed', {
        projectId: query.projectId,
        totalInteractions: analytics.summary.totalInteractions,
        uniqueVisitors: analytics.summary.uniqueVisitors,
      });

      res.status(200).json(analytics);
    } catch (error) {
      logger.error('Analytics query failed', {
        projectId: queryParams.projectId,
        error: error.message,
        stack: error.stack,
      });

      if (error instanceof BadRequestException) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({
          message: error.message || 'Failed to retrieve analytics',
        });
      }
    }
  }
}
