import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../public.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { BlacklistedTokenEntity } from './entities/blacklisted-token.entity';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    @InjectRepository(BlacklistedTokenEntity)
    private readonly blacklistedTokenRepository: Repository<BlacklistedTokenEntity>,
  ) {
    super();
  }

  /**
   * Cleanup expired blacklisted tokens to prevent database growth
   * This is performed periodically upon guard activation
   */
  private async cleanupExpiredTokens(): Promise<void> {
    try {
      // Calculate a random chance to run cleanup (1 in 100 requests)
      // This prevents the cleanup from running on every request
      const shouldCleanup = Math.random() < 0.01;

      if (shouldCleanup) {
        const now = new Date();

        // Delete all tokens that have expired
        const result = await this.blacklistedTokenRepository.delete({
          expiresAt: LessThan(now),
        });

        if (result.affected && result.affected > 0) {
          console.log(
            `Cleaned up ${result.affected} expired blacklisted tokens`,
          );
        }
      }
    } catch (error) {
      // Log but don't throw - this shouldn't block authentication
      console.error('Error cleaning up expired tokens:', error);
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Run token cleanup with a small probability
    this.cleanupExpiredTokens().catch((err) =>
      console.error('Failed to clean up expired tokens:', err),
    );

    if (isPublic) {
      return true;
    }

    // Extract the access token from the request
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers['authorization'];
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header');
    }
    const accessToken = authorization.split(' ')[1];

    // Check if the token is blacklisted
    const isBlacklisted = await this.blacklistedTokenRepository.findOne({
      where: { token: accessToken },
    });

    if (isBlacklisted) {
      throw new UnauthorizedException('Token is blacklisted');
    }

    // Proceed with the default JWT validation
    return super.canActivate(context) as Promise<boolean>;
  }
}
