import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getDevice, getOS, parseUserAgent } from 'src/utils/parseUserAgent';
import { AppRepositoryPort } from './app.repository.port';
import { LinkEntity } from 'src/links/link.entity';
import { InteractionEntity } from 'src/links/interaction.entity';
import { ProjectEntity } from 'src/projects/project.entity';
import { UserEntity } from 'src/users/user.entity';
import RowtConfig from 'src/rowtconfig';
import Stripe from 'stripe';

@Injectable()
export class AppRepositoryAdapter implements AppRepositoryPort {
  constructor(
    @InjectRepository(LinkEntity)
    private readonly linkRepository: Repository<LinkEntity>,
    @InjectRepository(InteractionEntity)
    private readonly interactionRepository: Repository<InteractionEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findLinkByShortCode(shortCode: string): Promise<LinkEntity | null> {
    try {
      console.log('Finding link by short code');

      const linkEntity = await this.linkRepository.findOne({
        where: { id: shortCode },
        relations: ['project'],
      });
      if (!linkEntity) return null;

      return linkEntity;
    } catch (e) {
      console.log(e);
      return null; // Make sure to return null instead of the error
    }
  }

  /**
   * Get user's tier information and allowances
   */
  async getUserTierInfo(userId: string): Promise<{
    tier: number;
    allowances: { links: number; interactions: number };
    subscriptionPeriod?: { start: Date; end: Date };
  }> {
    try {
      // Check for single-tenant mode
      if (RowtConfig.tenant_mode === 'single-tenant') {
        // In single-tenant mode, use unlimited values
        return {
          tier: 999, // High tier number for single-tenant
          allowances: {
            links: -1, // -1 indicates unlimited
            interactions: -1, // -1 indicates unlimited
          },
          subscriptionPeriod: {
            start: new Date(0), // Beginning of time
            end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          },
        };
      }

      // Find the user
      const user = await this.userRepository.findOne({
        where: { id: parseInt(userId) },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Default subscription period (30 days back to now)
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);
      const defaultEndDate = new Date();

      // Default tier for users without subscription
      const defaultResponse = {
        tier: 0,
        allowances: {
          links: RowtConfig.tierLimits.links[0] || 10,
          interactions: RowtConfig.tierLimits.interactions[0] || 1000,
        },
        subscriptionPeriod: {
          start: defaultStartDate,
          end: defaultEndDate,
        },
      };

      if (!user.customerId) {
        return defaultResponse;
      }

      // Get Stripe data with a short timeout
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
        timeout: 5000, // 5 second timeout
      });

      // Get customer with subscription data
      const customer = await stripe.customers.retrieve(user.customerId, {
        expand: ['subscriptions'],
      });

      if ('deleted' in customer && customer.deleted) {
        return defaultResponse;
      }

      const subscription = customer.subscriptions?.data[0];
      if (!subscription) {
        return defaultResponse;
      }

      // Get subscription periods from first subscription item
      let subscriptionPeriod = {
        start: defaultStartDate,
        end: defaultEndDate,
      };

      // Check if we have subscription items and get period dates
      if (
        subscription.items &&
        subscription.items.data &&
        subscription.items.data.length > 0 &&
        subscription.items.data[0].current_period_start &&
        subscription.items.data[0].current_period_end
      ) {
        subscriptionPeriod = {
          start: new Date(
            subscription.items.data[0].current_period_start * 1000,
          ),
          end: new Date(subscription.items.data[0].current_period_end * 1000),
        };
      }

      // Get product ID and tier metadata
      const productId = subscription.items.data[0].plan.product;
      const product = await stripe.products.retrieve(productId as string);
      const tier = product.metadata?.tier ? parseInt(product.metadata.tier) : 0;

      // Get allowances based on tier
      return {
        tier,
        allowances: {
          links:
            RowtConfig.tierLimits.links[tier] || RowtConfig.tierLimits.links[0],
          interactions:
            RowtConfig.tierLimits.interactions[tier] ||
            RowtConfig.tierLimits.interactions[0],
        },
        subscriptionPeriod,
      };
    } catch (error) {
      console.error('Error fetching user tier:', error);
      // Default to free tier in case of errors
      return {
        tier: 0,
        allowances: {
          links: RowtConfig.tierLimits.links[0] || 10,
          interactions: RowtConfig.tierLimits.interactions[0] || 1000,
        },
        subscriptionPeriod: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end: new Date(), // Now
        },
      };
    }
  }

  /**
   * Count interactions for a user in the current billing period
   */
  async getUserInteractionCount(userId: string): Promise<number> {
    try {
      // Get the user's tier info to get subscription period dates
      const tierInfo = await this.getUserTierInfo(userId);
      const periodStart = tierInfo.subscriptionPeriod?.start || new Date(0);
      const periodEnd = tierInfo.subscriptionPeriod?.end || new Date();

      // Updated query to count all interactions that happened within the period,
      // regardless of when the link was created
      const result = await this.interactionRepository.manager.query(
        `
        SELECT COUNT(i.id) as count 
        FROM interactions i
        JOIN links l ON i.link_id = l.id
        JOIN projects p ON l.project_id = p.id
        WHERE p.user_id = $1
        AND i.timestamp >= $2
        AND i.timestamp <= $3
      `,
        [userId, periodStart.toISOString(), periodEnd.toISOString()],
      );

      return parseInt(result[0]?.count || '0', 10);
    } catch (error) {
      console.error('Error getting user interaction count:', error);
      return 0; // Return 0 in case of error
    }
  }

  async logInteraction(data: {
    shortCode: string;
    country?: string | null;
    referer?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      if (!data.shortCode) {
        console.log('No short code provided');
        return;
      }

      // Find the link entity to get project and user info
      const linkEntity = await this.linkRepository.findOne({
        where: { id: data.shortCode },
        relations: ['project'],
      });

      if (!linkEntity || !linkEntity.project) {
        console.log('No link or project found');
        return;
      }

      const userId = linkEntity.project.userId;

      // Check if the user has reached their interaction limit
      const [tierInfo, currentInteractionCount] = await Promise.all([
        this.getUserTierInfo(userId),
        this.getUserInteractionCount(userId),
      ]);

      // Only apply limit if not unlimited (-1)
      if (
        tierInfo.allowances.interactions !== -1 &&
        currentInteractionCount >= tierInfo.allowances.interactions
      ) {
        console.log(
          `User ${userId} has reached interaction limit ${tierInfo.allowances.interactions}`,
        );
        // Still update click count, but don't store detailed interaction data
        linkEntity.lifetimeClicks += 1;
        await this.linkRepository.save(linkEntity);
        return;
      }

      console.log('Interaction logging for:', data.shortCode);
      console.log(`Redirecting user in ${data.country} from ${data.referer}`);

      const userEnv = parseUserAgent(data.userAgent as string);

      // Create the interaction entity
      const interactionEntity = this.interactionRepository.create({
        link: { id: data.shortCode },
        country: data.country ?? '',
        referer: data.referer ?? '',
        browser: userEnv.browser ?? '',
        os: userEnv.os ?? '',
        device: userEnv.device ?? '',
      });

      // Update link click count
      linkEntity.lifetimeClicks += 1;

      // Save both entities
      await Promise.all([
        this.linkRepository.save(linkEntity),
        this.interactionRepository.save(interactionEntity),
      ]);

      console.log('Interaction logged successfully');
    } catch (error) {
      console.error('Error logging interaction:', error);
      // Fail silently to not disrupt user experience
    }
  }

  openAppOnUserDevice(link: LinkEntity, userAgent: string): string {
    // Logic to open the app on the user's device
    const os = getOS(userAgent);
    const device = getDevice(userAgent);

    // is the link a deep link?
    const isDeepLink = !link.url.includes('http');

    if (!isDeepLink) {
      return link.url;
    }

    const project = link.project;

    const fallback = link.fallbackUrlOverride
      ? link.fallbackUrlOverride
      : link.project.fallbackUrl;

    console.log('Opening app on user device');
    console.log(`Platform: ${os}`);
    console.log(`Device: ${device}`);

    // No need for try/catch here as we're just determining the URL
    if (os === 'ios' || device === 'iphone' || device === 'ipad') {
      // Open app on iOS
      return `${link.project.iosScheme}${link.url.slice(1)}`;
    } else if (os === 'android') {
      // Open app on Android
      return `${link.project.androidScheme}${link.url.slice(1)}`;
    } else {
      // If not iOS or Android, use fallback
      console.log('Opening fallback');
      return fallback;
    }
  }
}
