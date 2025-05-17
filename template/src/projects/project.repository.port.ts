import { ProjectEntity } from './project.entity';
import { GetProjectOptions } from './project.model';
import { UpdateProjectDTO } from './dto/updateProjectDTO';
import { CreateProjectDTO } from './dto/createProjectDTO';

export abstract class ProjectRepositoryPort {
  abstract findById(
    code: string,
    options: GetProjectOptions,
  ): Promise<{
    project: ProjectEntity | null;
    previousPeriodInteractionCount?: number;
  }>;
  abstract authorize(projectId: string, apiKey: string): Promise<boolean>;
  abstract createProject(project: CreateProjectDTO): Promise<ProjectEntity>;
  abstract updateProject(project: UpdateProjectDTO): Promise<ProjectEntity>;
  abstract getUserProjects(userId: string): Promise<ProjectEntity[]>;
  abstract regenerateApiKey(projectId: string, userId: string): Promise<string>;
  // abstract deleteProject(projectId: string): Promise<ProjectEntity>;

  // abstract getProjectByApiKey(apiKey: string): Promise<ProjectEntity | null>;
  // abstract getProjectsByUserId(userId: string): Promise<ProjectEntity[]>;
  // abstract getProjectByShortcode(
  //   shortcode: string,
  // ): Promise<ProjectEntity | null>;
}
