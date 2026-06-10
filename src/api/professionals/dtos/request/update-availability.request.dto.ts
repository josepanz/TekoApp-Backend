import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateAvailabilityRequestDTO {
  @ApiProperty({
    description: 'Estado de disponibilidad del profesional',
    example: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isAvailable!: boolean;
}
