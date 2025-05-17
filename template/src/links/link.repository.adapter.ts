import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Link } from './link.model';
import { LinkRepositoryPort } from 'src/links/link.repository.port';
import Stripe from 'stripe';
import RowtConfig from 'src/rowtconfig';
import { UserEntity } from 'src/users/user.entity';
import { LinkEntity } from './link.entity';
import { ProjectEntity } from 'src/projects/project.entity';

@Injectable()
export class LinkRepositoryAdapter implements LinkRepositoryPort {
  constructor(
    @InjectRepository(LinkEntity)
    private readonly linkRepository: Repository<LinkEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async checkUserTier(userId: string): Promise<{
    tier: number;
    allowances: { links: number; interactions: number };
    subscriptionPeriod?: { start: Date; end: Date };
  }> {
    try {
      // Skip tier checks in single-tenant mode
      if (RowtConfig.tenant_mode === 'single-tenant') {
        return {
          tier: 999, // Use high tier number for single-tenant
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

      const user = await this.userRepository.findOne({
        where: { id: parseInt(userId) },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Default subscription period
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);
      const defaultEndDate = new Date();

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

      // Skip Stripe integration if disabled
      if (!RowtConfig.stripe_integration || !user.customerId) {
        return defaultResponse;
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
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

      // Get the product ID from the plan
      const productId = subscription.items.data[0].plan.product;

      // Fetch the product separately to get its metadata
      const product = await stripe.products.retrieve(productId as string);
      const tier = product.metadata?.tier ? parseInt(product.metadata.tier) : 0;

      const allowances = {
        links:
          RowtConfig.tierLimits.links[tier] || RowtConfig.tierLimits.links[0],
        interactions:
          RowtConfig.tierLimits.interactions[tier] ||
          RowtConfig.tierLimits.interactions[0],
      };

      return { tier, allowances, subscriptionPeriod };
    } catch (error) {
      console.error('Error fetching user tier:', error);
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

  private getJsonSize(obj: any): number {
    return Buffer.byteLength(JSON.stringify(obj || {}));
  }

  async createLink(link: Link): Promise<string> {
    // Map Link domain model to LinkEntity
    console.log(link);

    if (link.additionalMetadata) {
      const size = this.getJsonSize(link.additionalMetadata);
      if (size > RowtConfig.max_jsonb_size) {
        throw new Error(
          `Properties exceeds ${RowtConfig.max_jsonb_size / 1024}KB limit (${Math.round(size / 1024)}KB)`,
        );
      }
    }

    if (link.properties) {
      const size = this.getJsonSize(link.properties);
      if (size > RowtConfig.max_jsonb_size) {
        throw new Error(
          `Properties exceeds ${RowtConfig.max_jsonb_size / 1024}KB limit (${Math.round(size / 1024)}KB)`,
        );
      }
    }

    const project = await this.projectRepository.manager.findOne(
      ProjectEntity,
      {
        where: { id: link.projectId },
      },
    );

    if (!project || !project.userId) {
      throw new NotFoundException('Project not found or missing userId');
    }

    // Only check limits if not in single-tenant mode and Stripe integration is enabled
    if (RowtConfig.tenant_mode !== 'single-tenant') {
      const tierInformation = await this.checkUserTier(project.userId);

      // Only check limits if there is a limit (-1 means unlimited)
      if (tierInformation.allowances.links !== -1) {
        // Get subscription period dates
        const periodStart =
          tierInformation.subscriptionPeriod?.start || new Date(0);
        const periodEnd = tierInformation.subscriptionPeriod?.end || new Date();

        // Count links created within the subscription period
        const result = await this.projectRepository.manager.query(
          `SELECT COUNT(l.id) as count 
           FROM links l 
           JOIN projects p ON l.project_id = p.id 
           WHERE p.user_id = $1
           AND l.created_at >= $2
           AND l.created_at <= $3`,
          [project.userId, periodStart.toISOString(), periodEnd.toISOString()],
        );

        const linkCount = parseInt(result[0]?.count || '0', 10);

        if (linkCount >= tierInformation.allowances.links) {
          throw new Error(
            `You have reached the maximum of ${tierInformation.allowances.links} links allowed for your plan. Please upgrade to create more links.`,
          );
        }
      }
    }

    const linkEntity = this.linkRepository.create({
      project: { id: link.projectId },
      url: link.url,
      title: link.title,
      description: link.description,
      imageUrl: link.imageUrl,
      fallbackUrlOverride: link.fallbackUrlOverride,
      additionalMetadata: link.additionalMetadata,
      properties: link.properties,
      lifetimeClicks: 0,
    });

    console.log('LinkEntity being created');
    console.log(linkEntity);

    // Save to the database and return the uuid of the new entry
    const linkEntry = await this.linkRepository.save(linkEntity);

    return linkEntry.id;
  }

  async getLinksByProjectId(
    projectId: string,
    includeInteractions?: boolean,
  ): Promise<LinkEntity[]> {
    if (includeInteractions) {
      try {
        return this.linkRepository.find({
          where: { project: { id: projectId } },
          relations: ['interactions'],
        });
      } catch (error) {
        throw new NotFoundException(
          'Unable to find links and interactions: ' + error,
        );
      }
    } else {
      try {
        return this.linkRepository.find({
          where: { project: { id: projectId } },
        });
      } catch (error) {
        throw new NotFoundException('Unable to find links: ' + error);
      }
    }
  }
}
