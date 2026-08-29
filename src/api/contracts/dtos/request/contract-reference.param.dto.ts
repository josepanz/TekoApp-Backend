import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ContractReferenceParamDTO {
  @ApiProperty({ description: 'referenceId (UUID) del contrato' })
  @IsUUID('4')
  referenceId!: string;
}
