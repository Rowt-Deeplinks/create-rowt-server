import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CleanupService } from './cleanup.service';
import RowtConfig from 'src/rowtconfig';

@Injectable()
export class CleanupScheduler {
  private readonly logger = new Logger(CleanupScheduler.name);

  constructor(private readonly cleanupService: CleanupService) {}

  // Use the cron expression from config
  @Cron(RowtConfig.cleanup_cron_expression)
  async handleCleanup() {
    this.logger.log('Running scheduled cleanup...');
    await this.cleanupService.cleanupExpiredDataOptimized();
  }

  // Alternative: Run cleanup every 12 hours
  // @Cron('0 */12 * * *')
  // async handleCleanupTwiceDaily() {
  //   this.logger.log('Running scheduled cleanup...');
  //   await this.cleanupService.cleanupExpiredDataOptimized();
  // }

  // Alternative: Run cleanup every Sunday at 3 AM
  // @Cron('0 3 * * 0')
  // async handleWeeklyCleanup() {
  //   this.logger.log('Running weekly cleanup...');
  //   await this.cleanupService.cleanupExpiredDataOptimized();
  // }

  // Manual trigger for testing (can be called via an endpoint)
  async triggerManualCleanup() {
    this.logger.log('Running manual cleanup...');
    await this.cleanupService.cleanupExpiredDataOptimized();
  }
}
