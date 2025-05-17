import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkRepositoryAdapter } from './link.repository.adapter';
import { LinkService } from './link.service';
import { UserEntity } from 'src/users/user.entity';
import { LinkEntity } from './link.entity';
import { InteractionEntity } from './interaction.entity';
import { LinkController } from './link.controller';
import { ProjectModule } from 'src/projects/project.module';
import { ProjectEntity } from 'src/projects/project.entity';

@Module({
  imports: [
    ProjectModule,
    TypeOrmModule.forFeature([
      LinkEntity,
      InteractionEntity,
      ProjectEntity,
      UserEntity,
    ]), // Register the entities
  ],
  controllers: [LinkController],
  providers: [
    LinkService,
    {
      provide: 'LinkRepositoryPort', // Use a token for the port
      useClass: LinkRepositoryAdapter, // Provide the adapter implementation
    },
  ],
  exports: ['LinkRepositoryPort'],
})
export class LinkModule {}
