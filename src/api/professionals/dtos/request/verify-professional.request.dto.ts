import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class VerifyProfessionalRequestDTO {
  @ApiProperty({
    description: 'true = verificado, false = rechazado',
    example: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isVerified!: boolean;

  @ApiPropertyOptional({ description: 'Notas del proceso de verificación' })
  @IsOptional()
  @IsString()
  notes?: string;
}
