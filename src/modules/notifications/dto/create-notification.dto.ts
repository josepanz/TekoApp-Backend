import { IsEnum, IsString, IsOptional, IsArray, IsObject } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsArray()
  channels?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
