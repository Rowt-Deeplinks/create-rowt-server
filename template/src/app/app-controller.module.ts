import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppRepositoryAdapter } from './app.repository.adapter';
import { LinkEntity } from '../links/link.entity';
import { InteractionEntity } from '../links/interaction.entity';
import { ProjectEntity } from '../projects/project.entity';
import { UserEntity } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LinkEntity, InteractionEntity, ProjectEntity, UserEntity]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'AppRepository',
      useClass: AppRepositoryAdapter,
    },
  ],
  exports: [AppService],
})
export class AppControllerModule {}
