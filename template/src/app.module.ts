import RowtConfig from './rowtconfig';
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LinkModule } from './links/link.module';
import { ProjectModule } from './projects/project.module';
import { CleanupModule } from './cleanup/cleanup.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from './app/app.service';
import { UserEntity } from './users/user.entity';
import { ProjectEntity } from './projects/project.entity';
import { LinkEntity } from './links/link.entity';
import { InteractionEntity } from './links/interaction.entity';
import { RefreshTokenEntity } from './auth/tokens/entities/refresh-token.entity';
import { BlacklistedTokenEntity } from './auth/tokens/entities/blacklisted-token.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app/app.controller';
import { AppRepositoryAdapter } from './app/app.repository.adapter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/tokens/jwt-auth.guard';
import PGUseFactoryConfig from './database/PGUseFactoryConfig';
import { join } from 'path';
import { getDatabaseConfig } from './database/DatabaseFactoryConfig';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // force env file path and load
    }),
    AuthModule,
    UsersModule,
    ProjectModule,
    LinkModule,
    CleanupModule,
    TypeOrmModule.forFeature([
      LinkEntity,
      InteractionEntity,
      ProjectEntity,
      UserEntity,
      RefreshTokenEntity,
      BlacklistedTokenEntity,
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Import the env path
      inject: [ConfigService], // Inject the ConfigService so we can access that env data

      // GetDatabaseConfig is an abstracted factory function to create the DataSource,
      // Make sure to add any new entities to this file
      useFactory: getDatabaseConfig,
    }),
    ThrottlerModule.forRoot({
      throttlers: RowtConfig.rate_limit_defaults, // 10 requests per minute default
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // Path to your public folder
      serveRoot: '/static', // Serve files under the /static prefix
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'AppRepository',
      useClass: AppRepositoryAdapter,
    },
    {
      // Rate limit global guard, can be overridden per endpoint with the @Throttle() decorator
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      // JWRT Auth guard, can be overridden per endpoint with the @Public() decorator
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
