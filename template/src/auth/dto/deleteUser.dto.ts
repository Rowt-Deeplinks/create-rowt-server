import { IsEmail } from 'class-validator';

export class DeleteUserDTO {
  @IsEmail()
  email: string;
}
