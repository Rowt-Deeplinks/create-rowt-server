// src/features/projects/infrastructure/database/typeorm/project.repository.adapter.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from './project.entity';
import { UpdateProjectDTO } from './dto/updateProjectDTO';
import { CreateProjectDTO } from './dto/createProjectDTO';
import { ProjectRepositoryPort } from './project.repository.port';
import { GetProjectOptions } from './project.model';

@Injectable()
export class ProjectRepositoryAdapter implements ProjectRepositoryPort {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
  ) {}

  async findById(
    code: string,
    options: GetProjectOptions,
  ): Promise<{
    project: ProjectEntity | null;
    previousPeriodInteractionCount?: number;
  }> {
    // Create the base query builder for projects
    const queryBuilder = this.projectRepository.createQueryBuilder('project');

    // Filter by project ID
    queryBuilder.where('project.id = :id', { id: code });

    // Include links if specified in options
    if (options.includeLinks) {
      queryBuilder.leftJoinAndSelect('project.links', 'links');

      // Include interactions if specified in options
      if (options.includeInteractions) {
        // Join interactions but apply time filters here
        if (options.startDate && options.endDate) {
          queryBuilder.leftJoinAndSelect(
            'links.interactions',
            'interactions',
            'interactions.timestamp >= :startDate AND interactions.timestamp <= :endDate',
            { startDate: options.startDate, endDate: options.endDate },
          );
        } else {
          queryBuilder.leftJoinAndSelect('links.interactions', 'interactions');
        }
      }
    }

    // Log the query and parameters for debugging
    // console.log('Query:', queryBuilder.getQuery());
    // console.log('Parameters:', queryBuilder.getParameters());

    // Execute the query
    const project = await queryBuilder.getOne();

    // Calculate the total interactions count for the current period
    const totalInteractions =
      project?.links?.reduce((acc, link) => {
        return acc + (link.interactions?.length || 0);
      }, 0) || 0;

    // console.log('Total interactions should be:', totalInteractions);

    // Handle previous period calculation if requested
    let previousPeriodInteractionCount: number | undefined = undefined;

    if (options.getPreviousPeriod && options.startDate && options.endDate) {
      // Calculate the time span of the current period
      const currentPeriodDuration =
        new Date(options.endDate).getTime() -
        new Date(options.startDate).getTime();

      // Calculate the previous period start date
      const previousStartDate = new Date(
        new Date(options.startDate).getTime() - currentPeriodDuration,
      );

      // The previous period end date is the start date of the current period
      const previousEndDate = new Date(options.startDate);

      // console.log('Previous period:', previousStartDate, 'to', previousEndDate);

      // Execute a standalone query to get interaction count for the previous period
      const previousInteractionsCount = await this.projectRepository.manager
        .createQueryBuilder()
        .select('COUNT(DISTINCT interactions.id)', 'count')
        .from('interactions', 'interactions')
        .innerJoin('links', 'links', 'interactions.link_id = links.id')
        .where('links.project_id = :projectId', { projectId: code })
        .andWhere('interactions.timestamp >= :previousStartDate', {
          previousStartDate: previousStartDate.toISOString(),
        })
        .andWhere('interactions.timestamp < :previousEndDate', {
          previousEndDate: previousEndDate.toISOString(),
        })
        .getRawOne();

      // console.log('Previous period direct query parameters:', {
      //   projectId: code,
      //   previousStartDate: previousStartDate.toISOString(),
      //   previousEndDate: previousEndDate.toISOString(),
      // });

      previousPeriodInteractionCount = parseInt(
        previousInteractionsCount?.count || '0',
        10,
      );

      // console.log(
      //   'Previous period raw query result:',
      //   previousInteractionsCount,
      // );
      // console.log(
      //   'Previous period interaction count:',
      //   previousPeriodInteractionCount,
      // );
    }

    return { project, previousPeriodInteractionCount };
  }

  async authorize(projectId: string, apiKey: string): Promise<boolean> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, apiKey: apiKey },
    });
    return !!project;
  }

  async getUserProjects(userId: string): Promise<ProjectEntity[]> {
    const userProjects = this.projectRepository.find({
      where: { userId },
    });
    if (!userProjects) {
      throw new NotFoundException('User has no projects');
    }

    return userProjects;
  }

  async updateProject(project: UpdateProjectDTO): Promise<ProjectEntity> {
    console.log('ProjectRepositoryAdapter.updateProject');
    const existingProject = await this.projectRepository.findOne({
      where: { id: project.id },
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found');
    }

    // Update the project entity with new values
    Object.assign(existingProject, project);

    // Save the updated project
    const updatedProject = await this.projectRepository.save(existingProject);
    return updatedProject;
  }

  async createProject(project: CreateProjectDTO): Promise<ProjectEntity> {
    console.log('ProjectRepositoryAdapter.createProject');
    console.log(project);
    const newProject = this.projectRepository.create(project);
    return await this.projectRepository.save(newProject);
  }

  async regenerateApiKey(projectId: string, userId: string): Promise<string> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, userId: userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    // Generate a new UUID for the API key
    const { v4: uuidv4 } = require('uuid');
    const newApiKey = uuidv4();
    project.apiKey = newApiKey;
    await this.projectRepository.save(project);

    return newApiKey;
  }
}
