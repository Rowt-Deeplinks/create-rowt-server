import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthRepositoryPort, JWTObject } from './auth.repository.port';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { UserEntity } from 'src/users/user.entity';
import RowtConfig from 'src/rowtconfig';
import { RefreshTokenEntity } from './tokens/entities/refresh-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlacklistedTokenEntity } from './tokens/entities/blacklisted-token.entity';
import { getExpirationDate } from 'src/utils/getExpirationDate';
import { LoginDTO } from './dto/login.dto';
import LoginResponseDTO from './dto/loginResponse.dto';

@Injectable()
export class AuthRepositoryAdapter implements AuthRepositoryPort {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(RefreshTokenEntity)
    private refreshTokenRepository: Repository<RefreshTokenEntity>,
    @InjectRepository(BlacklistedTokenEntity)
    private blacklistedTokenRepository: Repository<BlacklistedTokenEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {
    // Hash admin password on service startup in single-tenant mode
    this.initializeSingleTenantPassword();
  }

  // Store the hashed admin password
  private hashedAdminPassword: string | null = null;

  private async initializeSingleTenantPassword(): Promise<void> {
    if (RowtConfig.tenant_mode === 'single-tenant') {
      const adminEmail = process.env.ROWT_ADMIN_EMAIL;
      const adminPassword = process.env.ROWT_ADMIN_PASSWORD;

      if (!adminEmail || !adminPassword) {
        console.error(
          'WARNING: ROWT_ADMIN_PASSWORD or ROWT_ADMIN_EMAIL environment variable not set in single-tenant mode',
        );
        return;
      }

      try {
        // Hash the admin password on startup
        const saltRounds = 10;
        this.hashedAdminPassword = await bcrypt.hash(adminPassword, saltRounds);
        console.log('Single-tenant admin password securely hashed');

        // Create or update admin user in database
        try {
          // Try to find the user
          const existingUser = await this.usersService.findByEmail(adminEmail);

          // Update the password if user exists
          if (existingUser) {
            existingUser.passwordHash = this.hashedAdminPassword;
            await this.usersService.updateUser(existingUser);
            console.log('Synced admin user password in database');
          }
        } catch (error) {
          // User doesn't exist, create it
          const createUserDto = {
            email: adminEmail,
            password: adminPassword, // usersService will hash this again
            role: 'admin',
          };

          await this.usersService.createUser(createUserDto);
          console.log('Created admin user in database');
        }
      } catch (error) {
        console.error('Failed to setup admin user:', error);
      }
    }
  }

  async validateCredentials(email: string, pass: string): Promise<UserEntity> {
    try {
      let userInDb: UserEntity;
      if (RowtConfig.tenant_mode === 'single-tenant') {
        // Check if we have a hashed password
        if (!this.hashedAdminPassword) {
          // Hash it on first use if not done at startup
          const adminPassword = process.env.ROWT_ADMIN_PASSWORD;
          if (!adminPassword) {
            throw new BadRequestException('Admin password not configured');
          }
          const saltRounds = 10;
          this.hashedAdminPassword = await bcrypt.hash(
            adminPassword,
            saltRounds,
          );
        }

        userInDb = {
          id: process.env.ROWT_ADMIN_UUID as unknown as number,
          email: process.env.ROWT_ADMIN_EMAIL as string,
          passwordHash: this.hashedAdminPassword,
          role: 'admin',
          emailVerified: true,
        };

        console.log(
          'Validating credentials for single-tenant mode',
          'email:',
          email,
          'password:',
          pass,
        );

        const isMatch = await bcrypt.compare(pass, this.hashedAdminPassword);
        if (isMatch) {
          return userInDb;
        }
        throw new BadRequestException('Password did not match');
      } else {
        userInDb = (await this.usersService.findByEmail(email)) as UserEntity;

        if (!userInDb) {
          throw new NotFoundException('User not found');
        }

        const isMatch = await bcrypt.compare(pass, userInDb.passwordHash);

        if (isMatch) {
          return userInDb;
        }
        throw new BadRequestException('Password did not match');
      }
    } catch (error) {
      throw new BadRequestException(
        'Unable to validate user: ' + error.message,
      );
    }
  }

  async login(user: LoginDTO): Promise<LoginResponseDTO> {
    try {
      let userEntity;

      if (
        RowtConfig.tenant_mode === 'single-tenant' &&
        user.email === process.env.ROWT_ADMIN_EMAIL
      ) {
        // For single-tenant, get the admin user that should now exist in DB
        try {
          userEntity = await this.usersService.findByEmail(user.email);
        } catch (error) {
          throw new Error(
            'Admin user not found in database. Server initialization may have failed.',
          );
        }
      } else {
        // Regular user lookup for multi-tenant mode
        userEntity = await this.usersService.findByEmail(user.email);
        if (!userEntity) {
          throw new NotFoundException('User not found');
        }
      }

      const tokens = await this.generateNewTokens(userEntity);

      return {
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        } as JWTObject,
        user: {
          id: userEntity.id,
          email: userEntity.email,
          role: userEntity.role,
          emailVerified: userEntity.emailVerified,
          customerId: userEntity.customerId as string,
        },
      };
    } catch (error) {
      throw new Error('Unable to login: ' + error);
    }
  }

  async logout(refreshToken: string, access_token: string): Promise<boolean> {
    try {
      const refreshTokenEntity = await this.refreshTokenRepository.findOne({
        where: { token: refreshToken },
      });
      if (!refreshTokenEntity) {
        throw new NotFoundException('Refresh token not found');
      }
      await this.refreshTokenRepository.remove(refreshTokenEntity);
      // Blacklist the access token
      const blacklistedToken = this.blacklistedTokenRepository.create({
        token: access_token,
        expiresAt: getExpirationDate(RowtConfig.accessTokenExpires),
      });
      await this.blacklistedTokenRepository.save(blacklistedToken);
      return true;
    } catch (error) {
      throw new BadRequestException('Unable to logout: ' + error);
    }
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<JWTObject | undefined> {
    try {
      const storedToken = await this.refreshTokenRepository.findOne({
        where: { token: refreshToken },
      });
      if (!storedToken) {
        throw new NotFoundException('Refresh token not found');
      }
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const access_token = this.jwtService.sign(payload, {
        expiresIn: RowtConfig.accessTokenExpires,
      });
      return {
        access_token,
        refresh_token: refreshToken,
      } as JWTObject;
    } catch (error) {
      throw new BadRequestException('Unable to refresh access token: ' + error);
    }
  }

  async validateRefreshToken(refreshToken: string): Promise<UserEntity | null> {
    try {
      const storedToken = await this.refreshTokenRepository.findOne({
        where: { token: refreshToken },
      });
      if (!storedToken) {
        return null;
      }
      const user = await this.usersService.findByEmail(storedToken.userEmail);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      throw new BadRequestException(
        'Unable to validate refresh token: ' + error,
      );
    }
  }

  async generateNewTokens(user: UserEntity): Promise<JWTObject> {
    try {
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      const access_token = this.jwtService.sign(payload, {
        expiresIn: RowtConfig.accessTokenExpires,
      });
      const refresh_token = this.jwtService.sign(payload, {
        expiresIn: RowtConfig.refreshTokenExpires,
      });
      const createdRefreshToken = this.refreshTokenRepository.create({
        userEmail: user.email,
        token: refresh_token,
        expiresAt: getExpirationDate(RowtConfig.refreshTokenExpires),
      });
      await this.refreshTokenRepository.save(createdRefreshToken);
      return {
        access_token,
        refresh_token,
      };
    } catch (error) {
      throw new BadRequestException(
        'Unable to generate access token: ' + error,
      );
    }
  }

  async updatePassword(
    email: string,
    newPassword: string,
  ): Promise<UserEntity> {
    try {
      // Check tenant mode from config
      if (RowtConfig.tenant_mode === 'single-tenant') {
        throw new BadRequestException(
          'This feature is not available in single-tenant mode',
        );
      }
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const saltOrRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltOrRounds);
      user.passwordHash = hashedPassword;

      await this.usersService.updateUser(user);
      return user;
    } catch (error) {
      throw new BadRequestException('Unable to update password: ' + error);
    }
  }
}
