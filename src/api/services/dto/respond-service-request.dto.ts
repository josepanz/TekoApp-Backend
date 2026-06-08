import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequestStatus } from '../entities/service-request.entity';

export class RespondServiceRequestDto {
  @ApiProperty({ enum: RequestStatus, description: 'Estado de la respuesta' })
  @IsEnum(RequestStatus)
  status: RequestStatus;

  @ApiPropertyOptional({ description: 'Razón del rechazo (si aplica)' })
  @IsOptional()
  @IsString()
  reason?: string;
}
