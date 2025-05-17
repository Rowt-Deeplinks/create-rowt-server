import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryPort } from './users.repository.port';
import { UserEntity } from './user.entity';
import { CreateUserDTO } from 'src/auth/dto/createUser.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepositoryPort,
  ) {}
  //   private readonly users = [
  //     {
  //       userId: 1,
  //       username: 'john',
  //       password: 'changeme',
  //     },
  //     {
  //       userId: 2,
  //       username: 'maria',
  //       password: 'guess',
  //     },
  //   ];

  async findByEmail(email: string): Promise<UserEntity | undefined> {
    return this.userRepository.findByEmail(email);
  }

  async findById(id: number): Promise<UserEntity | undefined> {
    return this.userRepository.findById(id);
  }

  async createUser(user: CreateUserDTO): Promise<UserEntity> {
    return this.userRepository.createUser(user);
  }

  async updateUser(newUserDetails: UserEntity): Promise<UserEntity> {
    return this.userRepository.updateUser(newUserDetails);
  }

  async deleteUser(email: string): Promise<UserEntity> {
    return this.userRepository.deleteUser(email);
  }

  async getUserUsage(id: number): Promise<{
    links: number;
    interactions: number;
    period: {
      start: Date;
      end: Date;
    };
  }> {
    return this.userRepository.getUserUsage(id);
  }
}
