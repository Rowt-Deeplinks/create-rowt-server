import { IsString, IsEmail } from 'class-validator';

export class UpdatePasswordDTO {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
