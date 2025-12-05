import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ObservabilityService } from './observability.service';
import { EventsQueryDTO } from './dto/events-query.dto';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

@Controller('observability')
export class ObservabilityController {
  constructor(
    private readonly observabilityService: ObservabilityService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 5000 } })
  @Post('events')
  async getEvents(
    @Body() query: EventsQueryDTO,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      logger.info('Events query requested', {
        userId: req.user?.userId,
        eventTypes: query.eventTypes,
      });

      // Force user-scoped filtering - users can ONLY see their own events
      query.userId = req.user?.userId;

      // Set default date range if not provided (last 24 hours)
      if (!query.startDate) {
        query.startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      }
      if (!query.endDate) {
        query.endDate = new Date();
      }

      // Validate date range
      if (query.startDate >= query.endDate) {
        res.status(400).json({ message: 'startDate must be before endDate' });
        return;
      }

      // Validate date range is not too large (max 90 days)
      const daysDiff =
        (query.endDate.getTime() - query.startDate.getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysDiff > 90) {
        res
          .status(400)
          .json({ message: 'Date range cannot exceed 90 days' });
        return;
      }

      // Execute events query
      const events = await this.observabilityService.getEvents(query);

      logger.info('Events query completed', {
        userId: req.user?.userId,
        eventCount: events.events.length,
      });

      res.status(200).json(events);
    } catch (error) {
      logger.error('Events query failed', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack,
      });

      if (error instanceof BadRequestException) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({
          message: error.message || 'Failed to retrieve events',
        });
      }
    }
  }
}
