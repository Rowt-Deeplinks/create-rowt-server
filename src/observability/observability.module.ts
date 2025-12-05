import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/user.entity';
import { ProjectEntity } from '../projects/project.entity';
import { LinkEntity } from '../links/link.entity';
import { InteractionEntity } from '../links/interaction.entity';
import { ObservabilityController } from './observability.controller';
import { ObservabilityService } from './observability.service';
import { ObservabilityRepositoryPort } from './observability.repository.port';
import { ObservabilityRepositoryAdapter } from './observability.repository.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      ProjectEntity,
      LinkEntity,
      InteractionEntity,
    ]),
  ],
  controllers: [ObservabilityController],
  providers: [
    ObservabilityService,
    {
      provide: ObservabilityRepositoryPort,
      useClass: ObservabilityRepositoryAdapter,
    },
  ],
  exports: [ObservabilityService],
})
export class ObservabilityModule {}
