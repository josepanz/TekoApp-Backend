import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetLineItemResponseDTO } from './budget-line-item.response.dto';

export class BudgetOptionResponseDTO {
  @ApiProperty({ description: 'referenceId (UUID) público' })
  referenceId!: string;

  @ApiProperty()
  label!: string;

  @ApiPropertyOptional()
  description!: string | null;

  @ApiProperty({
    description: 'Suma de los subtotales, recalculada server-side',
  })
  totalPrice!: number;

  @ApiPropertyOptional()
  estimatedHours!: number | null;

  @ApiProperty()
  isSelected!: boolean;

  @ApiProperty({ type: [BudgetLineItemResponseDTO] })
  lineItems!: BudgetLineItemResponseDTO[];
}
