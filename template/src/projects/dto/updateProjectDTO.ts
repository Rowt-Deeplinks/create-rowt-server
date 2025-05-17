import { IsUUID, IsUrl, IsOptional, IsString, IsDate } from 'class-validator';

export class UpdateProjectDTO {
  @IsUUID()
  @IsString()
  id: string;

  @IsString()
  apiKey: string;

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
