import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeReason } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDisputeRequestDTO {
  @ApiProperty({ enum: DisputeReason })
  @IsEnum(DisputeReason)
  reason!: DisputeReason;

  @ApiProperty({
    description: 'Explicación del reclamo',
    example: 'El profesional nunca llegó al domicilio pactado',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @ApiPropertyOptional({
    description: 'Keys de S3 de evidencia adjunta (fotos, comprobantes)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  evidenceKeys?: string[];
}
