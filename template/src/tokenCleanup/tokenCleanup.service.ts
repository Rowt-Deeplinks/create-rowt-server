import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { BlacklistedTokenEntity } from '../auth/tokens/entities/blacklisted-token.entity';
import { RefreshTokenEntity } from '../auth/tokens/entities/refresh-token.entity';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(
    @InjectRepository(BlacklistedTokenEntity)
    private readonly blacklistedTokenRepository: Repository<BlacklistedTokenEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
  ) {}

  // Run cleanup twice a day - 3:15 AM and 3:15 PM
  @Cron(CronExpression.EVERY_12_HOURS)
  async handleTokenCleanup() {
    this.logger.log('Running scheduled token cleanup...');

    try {
      const now = new Date();

      // Clean up blacklisted tokens
      const blacklistResult = await this.blacklistedTokenRepository.delete({
        expiresAt: LessThan(now),
      });

      this.logger.log(
        `Cleaned up ${blacklistResult.affected || 0} expired blacklisted tokens`,
      );

      // Clean up expired refresh tokens
      const refreshResult = await this.refreshTokenRepository.delete({
        expiresAt: LessThan(now),
      });

      this.logger.log(
        `Cleaned up ${refreshResult.affected || 0} expired refresh tokens`,
      );
      this.logger.log('Token cleanup completed successfully');
    } catch (error) {
      this.logger.error('Error during token cleanup:', error);
    }
  }

  // Manual trigger for testing (can be called via an endpoint)
  async triggerManualCleanup() {
    this.logger.log('Running manual token cleanup...');
    await this.handleTokenCleanup();
  }
}
