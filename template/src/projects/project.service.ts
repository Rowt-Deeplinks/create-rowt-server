import { Injectable } from '@nestjs/common';
import { ProjectRepositoryPort } from './project.repository.port';
import { GetProjectOptions } from './project.model';
import { UpdateProjectDTO } from './dto/updateProjectDTO';
import { ProjectEntity } from './project.entity';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepositoryPort, // Use the interface/abstract class as the token
  ) {}

  async authorize(projectId: string, apiKey: string): Promise<boolean> {
    return this.projectRepository.authorize(projectId, apiKey);
  }

  async findById(projectId: string, options: GetProjectOptions) {
    return this.projectRepository.findById(projectId, options);
  }

  async getUserProjects(userId: string) {
    return this.projectRepository.getUserProjects(userId);
  }
  async updateProject(project: UpdateProjectDTO) {
    return this.projectRepository.updateProject(project);
  }

  async createProject(project: UpdateProjectDTO): Promise<ProjectEntity> {
    return this.projectRepository.createProject(project);
  }

  async regenerateApiKey(projectId: string, userId: string): Promise<string> {
    return this.projectRepository.regenerateApiKey(projectId, userId);
  }
}
