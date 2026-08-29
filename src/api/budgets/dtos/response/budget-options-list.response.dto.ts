import { ApiProperty } from '@nestjs/swagger';
import { BudgetOptionResponseDTO } from './budget-option.response.dto';

export class BudgetOptionsListResponseDTO {
  @ApiProperty({ type: [BudgetOptionResponseDTO] })
  data!: BudgetOptionResponseDTO[];
}
