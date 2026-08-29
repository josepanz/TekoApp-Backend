import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { ServiceRequestParamsDTO } from '@api/services/dtos/request/service-request-params.param.dto';

export class SelectBudgetOptionParamsDTO extends ServiceRequestParamsDTO {
  @ApiProperty({ description: 'referenceId (UUID) de la opción elegida' })
  @IsUUID('4')
  optionReferenceId!: string;
}
