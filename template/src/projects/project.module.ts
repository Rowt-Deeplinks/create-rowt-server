import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectRepositoryAdapter } from './project.repository.adapter';
import { ProjectService } from './project.service';
import { ProjectEntity } from './project.entity';
import { ProjectRepositoryPort } from './project.repository.port';
import { UserEntity } from 'src/users/user.entity';
import ProjectController from './project.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectEntity, UserEntity])],
  controllers: [ProjectController],
  providers: [
    {
      provide: ProjectRepositoryPort, // Use the interface/abstract class as the token
      useClass: ProjectRepositoryAdapter, // Provide the adapter implementation
    },
    ProjectService,
  ],
  exports: [ProjectService],
})
export class ProjectModule {}
