import { IsUUID, IsUrl, IsOptional, IsString, IsDate, Matches, Length } from 'class-validator';

export class CreateLinkDTO {
  @IsUUID()
  @IsString()
  projectId: string;

  @IsString()
  apiKey: string;

  @IsUrl()
  url: string;

  @IsString()
  @IsOptional()
  @Length(1, 12)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Custom shortcode must only contain letters, numbers, hyphens, and underscores' })
  customShortcode?: string;

  @IsDate()
  @IsOptional()
  expiration?: Date;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsUrl()
  @IsOptional()
  fallbackUrlOverride?: string;

  @IsOptional()
  additionalMetadata?: Record<string, any>;

  @IsOptional()
  properties?: Record<string, any>;
}
