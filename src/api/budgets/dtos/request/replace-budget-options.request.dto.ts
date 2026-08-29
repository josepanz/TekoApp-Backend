import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';
import { BudgetOptionInputDTO } from './budget-option-input.dto';

export class ReplaceBudgetOptionsRequestDTO {
  @ApiProperty({ type: [BudgetOptionInputDTO] })
  @ValidateNested({ each: true })
  @Type(() => BudgetOptionInputDTO)
  @ArrayMinSize(1)
  options!: BudgetOptionInputDTO[];
}
