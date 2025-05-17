import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupService } from './cleanup.service';
import { CleanupController } from './cleanup.controller';
import { CleanupScheduler } from './cleanup.scheduler';
import { AuthModule } from 'src/auth/auth.module';
import { LinkEntity } from 'src/links/link.entity';
import { InteractionEntity } from 'src/links/interaction.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([LinkEntity, InteractionEntity]),
    AuthModule,
  ],
  controllers: [CleanupController],
  providers: [CleanupService, CleanupScheduler],
  exports: [CleanupService],
})
export class CleanupModule {}
