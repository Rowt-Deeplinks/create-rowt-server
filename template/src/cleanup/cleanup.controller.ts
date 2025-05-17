import { Controller, Post, HttpCode } from '@nestjs/common';
import { CleanupScheduler } from './cleanup.scheduler';
import { Throttle } from '@nestjs/throttler';

@Controller('cleanup')
export class CleanupController {
  constructor(private readonly cleanupScheduler: CleanupScheduler) {}

  @Post('trigger')
  @Throttle({ default: { limit: 1, ttl: 60000 * 30 } }) // Only allow 1 cleanup per 30 minutes
  @HttpCode(200)
  async triggerCleanup() {
    await this.cleanupScheduler.triggerManualCleanup();
    return {
      message: 'Cleanup triggered successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
