import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryStatus } from '@prisma/client';

export class ChangeCategoryStatusQueryDTO {
  @ApiProperty({
    description: 'Nuevo estado de la categoría',
    enum: CategoryStatus,
  })
  @IsEnum(CategoryStatus)
  status!: CategoryStatus;
}
