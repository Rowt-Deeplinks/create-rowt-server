import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { LocalAuthGuard } from 'src/auth/local-auth.guard';
import { AuthService } from 'src/auth/auth.service';
import { Public } from 'src/auth/public.guard';
import { LoginDTO } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';
import { UserEntity } from 'src/users/user.entity';
import { logger } from 'src/utils/logger';
import { UpdatePasswordDTO } from './dto/updatePassword.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDTO: LoginDTO) {
    try {
      const userFromDb = await this.authService.validateCredentials(
        loginDTO.email,
        loginDTO.password,
      );

      if (!userFromDb) {
        throw new BadRequestException('Invalid email or password');
      }

      const loginResponse = await this.authService.login(userFromDb);
      const tokensToIssue = loginResponse.tokens;

      logger.debug('Login successful', { userId: loginResponse.user.id, email: loginResponse.user.email });
      return {
        tokens: {
          access_token: tokensToIssue.access_token,
          refresh_token: tokensToIssue.refresh_token,
        },
        user: loginResponse.user,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  async logout(@Body() body: { refresh_token: string; access_token: string }) {
    if (!body?.refresh_token && !body?.access_token) {
      logger.warn('Logout attempt without tokens');
      throw new BadRequestException(
        'Refresh token and access token are required',
      );
    }
    try {
      this.authService.logout(body.refresh_token, body.access_token);
      return { message: 'Logout successful' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('refresh')
  async refresh(@Body() body: { refresh_token: string }) {
    logger.debug('Refresh token request received');
    if (!body?.refresh_token) {
      logger.warn('Refresh attempt without token');
      throw new BadRequestException('Refresh token is required');
    }

    try {
      // Validate the refresh token first
      const user = await this.authService.validateRefreshToken(
        body.refresh_token,
      );
      if (!user) {
        logger.warn('Invalid refresh token attempt');
        throw new UnauthorizedException('Invalid refresh token');
      }

      logger.debug('Valid refresh token', { email: user.email });

      // Generate a new access token without full re-login
      const newTokens = await this.authService.generateNewTokens(user);

      return {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Public()
  @Post('validate')
  @HttpCode(200)
  async validate(@Body() loginDTO: LoginDTO, @Res() res: ExpressResponse) {
    try {
      const user = await this.authService.validateCredentials(
        loginDTO.email,
        loginDTO.password,
      );
      res.status(200).json({
        message: 'Valid User',
        isValid: !!user,
      });
    } catch (error) {
      logger.error('Error validating user', { error: error.message });
      if (error.message.includes('Password did not match')) {
        res.status(200).json({
          message: 'Password did not match',
          isValid: false,
        });
      } else {
        res.status(500).json({
          message: 'Error validating user',
          isValid: false,
        });
      }
    }
  }

  @Post('updatepassword')
  @HttpCode(200)
  async updatePassword(@Body() updatePasswordDTO: UpdatePasswordDTO) {
    try {
      const updatedUser = await this.authService.updatePassword(
        updatePasswordDTO.email,
        updatePasswordDTO.password,
      );
      return updatedUser as UserEntity;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('profile')
  getProfile(@Request() req) {
    return {
      email: req.user.email,
      userId: req.user.userId,
      role: req.user.role,
    };
  }

  @Public()
  @Get() // Base route returns a default help dialog
  getHello(): string {
    return 'Hello World!';
  }
}
