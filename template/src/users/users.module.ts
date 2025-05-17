import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRepositoryAdapter } from './users.repository.adapter';
import { UsersController } from './users.controller';
import { UserEntity } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'src/auth/tokens/jwt-auth.guard';
import { BlacklistedTokenEntity } from 'src/auth/tokens/entities/blacklisted-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, BlacklistedTokenEntity])],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'UserRepository',
      useClass: UserRepositoryAdapter,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
