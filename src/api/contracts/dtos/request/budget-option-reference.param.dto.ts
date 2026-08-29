import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class BudgetOptionReferenceParamDTO {
  @ApiProperty({
    description: 'referenceId (UUID) de la opción de presupuesto elegida',
  })
  @IsUUID('4')
  referenceId!: string;
}
