import { IsUrl, IsOptional, IsString } from 'class-validator';

export class CreateProjectDTO {
  @IsString()
  userId: string;

  @IsString()
  name: string;

  @IsUrl()
  @IsString()
  baseUrl: string;

  @IsUrl()
  @IsString()
  fallbackUrl: string;

  @IsOptional()
  @IsString()
  appstoreId?: string;

  @IsOptional()
  @IsString()
  playstoreId?: string;

  @IsOptional()
  @IsString()
  iosUriScheme?: string;

  @IsOptional()
  @IsString()
  androidUriScheme?: string;
}
