import { IsOptional, IsDate, IsArray, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class EventsQueryDTO {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsArray()
  @IsEnum(['user.created', 'user.updated', 'project.created', 'project.updated', 'link.created', 'interaction.created'], { each: true })
  eventTypes?: string[];

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  linkId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortDirection?: 'ASC' | 'DESC';
}
