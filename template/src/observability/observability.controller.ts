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
      const userRole = (req.user as any)?.role || 'user';
      const isAdmin = userRole === 'admin';

      logger.info('Events query requested', {
        userId: req.user?.userId,
        role: userRole,
        projectId: query.projectId,
      });

      // Non-admin users MUST provide projectId
      if (!isAdmin && !query.projectId) {
        res.status(400).json({ message: 'projectId is required' });
        return;
      }

      // For non-admin users, verify project ownership
      if (!isAdmin && query.projectId && req.user?.userId) {
        const hasAccess = await this.observabilityService.verifyProjectAccess(
          query.projectId,
          req.user.userId,
        );
        if (!hasAccess) {
          res.status(403).json({ message: 'Project access denied' });
          return;
        }
      }

      // Admin users can query all events (no userId filter)
      // Non-admin users are limited to their own events
      if (!isAdmin) {
        query.userId = req.user?.userId;
      }

      // Validate date range if provided
      if (query.startDate && query.endDate && query.startDate >= query.endDate) {
        res.status(400).json({ message: 'startDate must be before endDate' });
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
