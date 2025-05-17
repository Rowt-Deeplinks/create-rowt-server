import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import RowtConfig from 'src/rowtconfig';
import { LinkEntity } from 'src/links/link.entity';
import { InteractionEntity } from 'src/links/interaction.entity';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    @InjectRepository(LinkEntity)
    private readonly linkRepository: Repository<LinkEntity>,
    @InjectRepository(InteractionEntity)
    private readonly interactionRepository: Repository<InteractionEntity>,
  ) {}

  async cleanupExpiredData(): Promise<void> {
    this.logger.log('Starting cleanup of expired data...');

    try {
      // Cleanup expired interactions
      await this.cleanupExpiredInteractions();

      // Cleanup expired links with no recent interactions
      await this.cleanupExpiredLinks();

      this.logger.log('Cleanup completed successfully');
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
      throw error;
    }
  }

  private async cleanupExpiredInteractions(): Promise<void> {
    const interactionExpirationDate = new Date();
    interactionExpirationDate.setDate(
      interactionExpirationDate.getDate() -
        RowtConfig.interaction_expiration_days,
    );

    const deleteResult = await this.interactionRepository.delete({
      timestamp: LessThan(interactionExpirationDate),
    });

    this.logger.log(`Deleted ${deleteResult.affected} expired interactions`);
  }

  private async cleanupExpiredLinks(): Promise<void> {
    const linkExpirationDate = new Date();
    linkExpirationDate.setDate(
      linkExpirationDate.getDate() - RowtConfig.link_expiration_days,
    );

    const recentInteractionThreshold = new Date();
    recentInteractionThreshold.setDate(
      recentInteractionThreshold.getDate() - RowtConfig.link_extension_days,
    );

    // Find all links older than the expiration days
    const oldLinks = await this.linkRepository.find({
      where: {
        createdAt: LessThan(linkExpirationDate),
      },
      relations: ['interactions'],
    });

    let deletedCount = 0;

    // Check each link for recent interactions
    for (const link of oldLinks) {
      const hasRecentInteraction = link.interactions.some(
        (interaction) => interaction.timestamp > recentInteractionThreshold,
      );

      if (!hasRecentInteraction) {
        await this.linkRepository.remove(link);
        deletedCount++;
      }
    }

    this.logger.log(`Deleted ${deletedCount} expired links`);
  }

  // Safe implementation using parameterized queries
  async cleanupExpiredDataOptimized(): Promise<void> {
    this.logger.log('Starting optimized cleanup of expired data...');

    try {
      // Get expiration dates
      const interactionExpirationDate = new Date();
      interactionExpirationDate.setDate(
        interactionExpirationDate.getDate() -
          RowtConfig.interaction_expiration_days,
      );

      const linkExpirationDate = new Date();
      linkExpirationDate.setDate(
        linkExpirationDate.getDate() - RowtConfig.link_expiration_days,
      );

      const linkExtensionDate = new Date();
      linkExtensionDate.setDate(
        linkExtensionDate.getDate() - RowtConfig.link_extension_days,
      );

      // Cleanup expired interactions - using prepared statement
      const interactionResult = await this.interactionRepository.query(
        `DELETE FROM interactions WHERE timestamp < $1`,
        [interactionExpirationDate],
      );

      this.logger.log(
        `Deleted ${interactionResult[1] || 0} expired interactions`,
      );

      // Cleanup expired links with no recent interactions - using prepared statement
      // Note: We're using direct SQL with parameters since TypeORM's DeleteQueryBuilder
      // doesn't support subquery properly
      const linkResult = await this.linkRepository.query(
        `DELETE FROM links 
         WHERE created_at < $1
         AND NOT EXISTS (
           SELECT 1 FROM interactions i 
           WHERE i.link_id = links.id 
           AND i.timestamp > $2
         )`,
        [linkExpirationDate, linkExtensionDate],
      );

      this.logger.log(`Deleted ${linkResult[1] || 0} expired links`);
      this.logger.log('Optimized cleanup completed successfully');
    } catch (error) {
      this.logger.error('Error during optimized cleanup:', error);
      throw error;
    }
  }
}
