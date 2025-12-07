import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { ProjectEntity } from '../projects/project.entity';
import { LinkEntity } from '../links/link.entity';
import { InteractionEntity } from '../links/interaction.entity';
import { ObservabilityRepositoryPort } from './observability.repository.port';
import { EventsQueryDTO } from './dto/events-query.dto';
import { EventsResponseDTO, EventDTO } from './dto/events-response.dto';

@Injectable()
export class ObservabilityRepositoryAdapter
  implements ObservabilityRepositoryPort
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @InjectRepository(LinkEntity)
    private readonly linkRepository: Repository<LinkEntity>,
    @InjectRepository(InteractionEntity)
    private readonly interactionRepository: Repository<InteractionEntity>,
  ) {}

  async getEvents(query: EventsQueryDTO): Promise<EventsResponseDTO> {
    const startDate = query.startDate || new Date(0); // Beginning of time if not specified
    const endDate = query.endDate || new Date();
    const limit = Math.min(query.limit || 50, 500);
    const offset = query.offset || 0;
    const userId = query.userId; // User-scoped filtering (enforced by controller)

    // Collect events from all sources in parallel
    const eventPromises: Promise<EventDTO[]>[] = [];

    if (!query.eventTypes || query.eventTypes.includes('user.created')) {
      eventPromises.push(this.getUserCreatedEvents(startDate, endDate, userId));
    }

    if (!query.eventTypes || query.eventTypes.includes('user.updated')) {
      eventPromises.push(this.getUserUpdatedEvents(startDate, endDate, userId));
    }

    if (!query.eventTypes || query.eventTypes.includes('project.created')) {
      eventPromises.push(
        this.getProjectCreatedEvents(startDate, endDate, userId, query),
      );
    }

    if (!query.eventTypes || query.eventTypes.includes('project.updated')) {
      eventPromises.push(
        this.getProjectUpdatedEvents(startDate, endDate, userId, query),
      );
    }

    if (!query.eventTypes || query.eventTypes.includes('link.created')) {
      eventPromises.push(
        this.getLinkCreatedEvents(startDate, endDate, userId, query),
      );
    }

    if (!query.eventTypes || query.eventTypes.includes('interaction.created')) {
      eventPromises.push(
        this.getInteractionCreatedEvents(startDate, endDate, userId, query),
      );
    }

    // Execute all queries in parallel
    const eventArrays = await Promise.all(eventPromises);

    // Flatten and sort by timestamp
    let allEvents = eventArrays.flat().sort((a, b) => {
      const direction = query.sortDirection === 'ASC' ? 1 : -1;
      return direction * (a.timestamp.getTime() - b.timestamp.getTime());
    });

    // Apply search filter if provided
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      allEvents = allEvents.filter((event) => {
        const searchableText = JSON.stringify({
          type: event.type,
          actor: event.actor,
          resource: event.resource,
          metadata: event.metadata,
        }).toLowerCase();
        return searchableText.includes(searchLower);
      });
    }

    // Apply pagination
    const total = allEvents.length;
    const paginatedEvents = allEvents.slice(offset, offset + limit);

    return {
      events: paginatedEvents,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    };
  }

  async verifyProjectAccess(
    projectId: string,
    userId: string,
  ): Promise<boolean> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, userId: userId },
    });
    return !!project;
  }

  private async getUserCreatedEvents(
    startDate: Date,
    endDate: Date,
    userId?: string,
  ): Promise<EventDTO[]> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :startDate', { startDate })
      .andWhere('user.createdAt <= :endDate', { endDate });

    if (userId) {
      qb.andWhere('user.id = :userId', { userId });
    }

    const users = await qb.getMany();

    return users.map((user) => ({
      id: `user.created_${user.createdAt.toISOString()}_${user.id}`,
      type: 'user.created',
      timestamp: user.createdAt,
      actor: {
        type: 'system' as const,
      },
      resource: {
        type: 'user' as const,
        id: user.id.toString(),
        attributes: {
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      },
    }));
  }

  private async getUserUpdatedEvents(
    startDate: Date,
    endDate: Date,
    userId?: string,
  ): Promise<EventDTO[]> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.updatedAt > user.createdAt')
      .andWhere('user.updatedAt >= :startDate', { startDate })
      .andWhere('user.updatedAt <= :endDate', { endDate });

    if (userId) {
      qb.andWhere('user.id = :userId', { userId });
    }

    const users = await qb.getMany();

    return users.map((user) => ({
      id: `user.updated_${user.updatedAt.toISOString()}_${user.id}`,
      type: 'user.updated',
      timestamp: user.updatedAt,
      actor: {
        type: 'user' as const,
        id: user.id.toString(),
        email: user.email,
      },
      resource: {
        type: 'user' as const,
        id: user.id.toString(),
        attributes: {
          email: user.email,
          emailVerified: user.emailVerified,
        },
      },
    }));
  }

  private async getProjectCreatedEvents(
    startDate: Date,
    endDate: Date,
    userId?: string,
    query?: EventsQueryDTO,
  ): Promise<EventDTO[]> {
    const qb = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.user', 'user')
      .where('project.createdAt >= :startDate', { startDate })
      .andWhere('project.createdAt <= :endDate', { endDate });

    if (userId) {
      qb.andWhere('project.userId = :userId', { userId });
    }

    if (query?.projectId) {
      qb.andWhere('project.id = :projectId', { projectId: query.projectId });
    }

    const projects = await qb.getMany();

    return projects.map((project) => ({
      id: `project.created_${project.createdAt.toISOString()}_${project.id}`,
      type: 'project.created',
      timestamp: project.createdAt,
      actor: {
        type: 'user' as const,
        id: project.userId,
        email: project.user?.email,
      },
      resource: {
        type: 'project' as const,
        id: project.id,
        attributes: {
          name: project.name,
          baseUrl: project.baseUrl,
        },
      },
    }));
  }

  private async getProjectUpdatedEvents(
    startDate: Date,
    endDate: Date,
    userId?: string,
    query?: EventsQueryDTO,
  ): Promise<EventDTO[]> {
    const qb = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.user', 'user')
      .where('project.updatedAt > project.createdAt')
      .andWhere('project.updatedAt >= :startDate', { startDate })
      .andWhere('project.updatedAt <= :endDate', { endDate });

    if (userId) {
      qb.andWhere('project.userId = :userId', { userId });
    }

    if (query?.projectId) {
      qb.andWhere('project.id = :projectId', { projectId: query.projectId });
    }

    const projects = await qb.getMany();

    return projects.map((project) => ({
      id: `project.updated_${project.updatedAt.toISOString()}_${project.id}`,
      type: 'project.updated',
      timestamp: project.updatedAt,
      actor: {
        type: 'user' as const,
        id: project.userId,
        email: project.user?.email,
      },
      resource: {
        type: 'project' as const,
        id: project.id,
        attributes: {
          name: project.name,
          baseUrl: project.baseUrl,
        },
      },
    }));
  }

  private async getLinkCreatedEvents(
    startDate: Date,
    endDate: Date,
    userId?: string,
    query?: EventsQueryDTO,
  ): Promise<EventDTO[]> {
    const qb = this.linkRepository
      .createQueryBuilder('link')
      .leftJoinAndSelect('link.project', 'project')
      .leftJoinAndSelect('project.user', 'user')
      .where('link.createdAt >= :startDate', { startDate })
      .andWhere('link.createdAt <= :endDate', { endDate });

    if (userId) {
      qb.andWhere('project.userId = :userId', { userId });
    }

    if (query?.projectId) {
      qb.andWhere('link.project.id = :projectId', {
        projectId: query.projectId,
      });
    }

    if (query?.linkId) {
      qb.andWhere('link.id = :linkId', { linkId: query.linkId });
    }

    const links = await qb.getMany();

    return links.map((link) => ({
      id: `link.created_${link.createdAt.toISOString()}_${link.id}`,
      type: 'link.created',
      timestamp: link.createdAt,
      actor: {
        type: 'user' as const,
        id: link.project?.userId,
        email: link.project?.user?.email,
      },
      resource: {
        type: 'link' as const,
        id: link.id,
        attributes: {
          shortCode: link.id,
          url: link.url,
          title: link.title,
          description: link.description,
          fallbackUrlOverride: link.fallbackUrlOverride,
          additionalMetadata: link.additionalMetadata,
          properties: link.properties,
          lifetimeClicks: link.lifetimeClicks,
          projectId: link.project?.id,
          projectName: link.project?.name,
        },
      },
    }));
  }

  private async getInteractionCreatedEvents(
    startDate: Date,
    endDate: Date,
    userId?: string,
    query?: EventsQueryDTO,
  ): Promise<EventDTO[]> {
    const qb = this.interactionRepository
      .createQueryBuilder('interaction')
      .leftJoinAndSelect('interaction.link', 'link')
      .leftJoinAndSelect('link.project', 'project')
      .where('interaction.timestamp >= :startDate', { startDate })
      .andWhere('interaction.timestamp <= :endDate', { endDate });

    if (userId) {
      qb.andWhere('project.userId = :userId', { userId });
    }

    if (query?.projectId) {
      qb.andWhere('link.project.id = :projectId', {
        projectId: query.projectId,
      });
    }

    if (query?.linkId) {
      qb.andWhere('interaction.link.id = :linkId', { linkId: query.linkId });
    }

    const interactions = await qb.getMany();

    return interactions.map((interaction) => ({
      id: `interaction.created_${interaction.timestamp.toISOString()}_${interaction.id}`,
      type: 'interaction.created',
      timestamp: interaction.timestamp,
      actor: {
        type: 'system' as const,
      },
      resource: {
        type: 'interaction' as const,
        id: interaction.id,
        attributes: {
          linkId: interaction.link?.id,
          shortCode: interaction.link?.id,
          linkUrl: interaction.link?.url,
          linkTitle: interaction.link?.title,
          resolvedUrl: interaction.resolvedUrl,
          projectId: interaction.link?.project?.id,
          projectName: interaction.link?.project?.name,
          country: interaction.country,
          city: interaction.city,
          device: interaction.device,
          os: interaction.os,
          browser: interaction.browser,
          utmSource: interaction.utmSource,
          utmMedium: interaction.utmMedium,
          utmCampaign: interaction.utmCampaign,
          utmTerm: interaction.utmTerm,
          utmContent: interaction.utmContent,
        },
      },
      metadata: {
        ip: interaction.ip,
        referer: interaction.referer,
      },
    }));
  }
}
