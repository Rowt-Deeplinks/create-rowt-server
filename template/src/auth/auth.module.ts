import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './tokens/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

import { AuthRepositoryAdapter } from './auth.repository.adapter';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from './tokens/jwt-auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RefreshTokenEntity } from './tokens/entities/refresh-token.entity';
import { BlacklistedTokenEntity } from './tokens/entities/blacklisted-token.entity';
import { TokenCleanupService } from 'src/tokenCleanup/tokenCleanup.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UserEntity } from 'src/users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.ROWT_JWT_SECRET as string,
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forFeature([RefreshTokenEntity, BlacklistedTokenEntity, UserEntity]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    TokenCleanupService,
    {
      provide: 'AuthRepository',
      useClass: AuthRepositoryAdapter,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
