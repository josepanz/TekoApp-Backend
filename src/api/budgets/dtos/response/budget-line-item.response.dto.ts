import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetLineItemType } from '@prisma/client';

export class BudgetLineItemResponseDTO {
  @ApiProperty({ description: 'referenceId (UUID) público' })
  referenceId!: string;

  @ApiProperty({ enum: BudgetLineItemType })
  itemType!: BudgetLineItemType;

  @ApiPropertyOptional({ description: 'null si es un ítem libre' })
  catalogItemReferenceId!: string | null;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unitPrice!: number;

  @ApiProperty({ description: 'quantity * unitPrice, recalculado server-side' })
  subtotal!: number;
}
