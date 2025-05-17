import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AuthRepositoryPort } from './auth.repository.port';
import { validatePassword } from 'src/utils/validatePassword';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject('AuthRepository') private authRepository: AuthRepositoryPort,
  ) {}

  async validateCredentials(email: string, pass: string): Promise<any> {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
    if (!pass) {
      throw new BadRequestException('Invalid password format');
    }
    return this.authRepository.validateCredentials(email, pass);
  }

  async login(user: any) {
    console.log('login:', user);
    try {
      return this.authRepository.login(user);
    } catch (error) {
      throw new BadRequestException('Unable to login: ' + error.message);
    }
  }

  async logout(refreshToken: string, accessToken: string) {
    try {
      return this.authRepository.logout(refreshToken, accessToken);
    } catch (error) {
      throw new BadRequestException('Unable to logout: ' + error.message);
    }
  }

  async refreshAccessToken(refreshToken: string) {
    return this.authRepository.refreshAccessToken(refreshToken);
  }

  async validateRefreshToken(refreshToken: string) {
    return this.authRepository.validateRefreshToken(refreshToken);
  }

  async generateNewTokens(user: any) {
    try {
      return this.authRepository.generateNewTokens(user);
    } catch (error) {
      throw new BadRequestException(
        'Unable to generate new tokens: ' + error.message,
      );
    }
  }

  async updatePassword(email: string, password: string) {
    try {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new BadRequestException('Invalid email format');
      }
      if (!password || !validatePassword(password)) {
        throw new BadRequestException('Invalid password format');
      }
      return await this.authRepository.updatePassword(email, password);
    } catch (error) {
      throw new BadRequestException(
        'Unable to update password: ' + error.message,
      );
    }
  }
}
