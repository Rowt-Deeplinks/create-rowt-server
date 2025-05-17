import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AppRepositoryAdapter } from './app/app.repository.adapter';
import { createDataSource } from './utils/createDataSource';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from './users/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from './projects/infrastructure/database/typeorm/project.entity';
import { InteractionEntity } from './links/infrastructure/database/typeorm/entities/interaction.entity';
import { LinkEntity } from './links/infrastructure/database/typeorm/entities/link.entity';
import { forwardRef } from '@nestjs/common';
import { ProjectModule } from './projects/infrastructure/database/typeorm/project.module';
import { LinkModule } from './links/link.module';
import PGUseFactoryConfig from './config/postgres/PGUseFactoryConfig';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        forwardRef(() => ProjectModule),
        forwardRef(() => LinkModule),
        TypeOrmModule.forFeature([
          LinkEntity,
          InteractionEntity,
          ProjectEntity,
          UserEntity,
        ]),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: PGUseFactoryConfig,
        }),
        AuthModule,
        UsersModule,
      ],
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: 'AppRepository',
          useClass: AppRepositoryAdapter,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return a help page', () => {});
  });
});
