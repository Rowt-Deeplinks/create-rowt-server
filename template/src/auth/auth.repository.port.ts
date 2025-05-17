import { UserEntity } from 'src/users/user.entity';
import { LoginDTO } from './dto/login.dto';
import LoginResponseDTO from './dto/loginResponse.dto';

export interface JWTObject {
  access_token: string;
  refresh_token: string;
}

export interface AuthRepositoryPort {
  validateCredentials(email: string, password: string): Promise<UserEntity>;
  login(user: LoginDTO): Promise<LoginResponseDTO>;
  logout(refreshToken: string, access_token: string): Promise<boolean>;
  refreshAccessToken(refreshToken: string): Promise<JWTObject | undefined>;
  validateRefreshToken(refreshToken: string): Promise<UserEntity | null>;
  generateNewTokens(user: UserEntity): Promise<JWTObject>;
  updatePassword(email: string, newPassword: string): Promise<UserEntity>;
}
