import { UserEntity } from './user.entity';
import { CreateUserDTO } from 'src/auth/dto/createUser.dto';

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<UserEntity | undefined>;
  findById(id: number): Promise<UserEntity | undefined>;
  createUser(user: CreateUserDTO): Promise<UserEntity>;
  updateUser(newUserDetails: UserEntity): Promise<UserEntity>;
  deleteUser(email: string): Promise<UserEntity>;
  getUserUsage(id: number): Promise<{
    links: number;
    interactions: number;
    period: {
      start: Date;
      end: Date;
    };
  }>;
}
