import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetLineItemType } from '@prisma/client';

export class ContractLineItemSnapshotDTO {
  @ApiProperty({ enum: BudgetLineItemType })
  itemType!: BudgetLineItemType;

  @ApiPropertyOptional({ description: 'null si era un ítem libre' })
  catalogItemName!: string | null;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unitPrice!: number;

  @ApiProperty()
  subtotal!: number;
}

export class ContractServiceSnapshotDTO {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  categoryName!: string;
}

export class ContractBudgetOptionSnapshotDTO {
  @ApiProperty()
  label!: string;

  @ApiPropertyOptional()
  description!: string | null;

  @ApiProperty()
  totalPrice!: number;

  @ApiPropertyOptional()
  estimatedHours!: number | null;
}

/// Congelado server-side al generar el contrato — nunca se relee `BudgetOptions` en vivo después.
export class ContractContentSnapshotDTO {
  @ApiProperty({ type: ContractServiceSnapshotDTO })
  service!: ContractServiceSnapshotDTO;

  @ApiProperty({ type: ContractBudgetOptionSnapshotDTO })
  budgetOption!: ContractBudgetOptionSnapshotDTO;

  @ApiProperty({ type: [ContractLineItemSnapshotDTO] })
  lineItems!: ContractLineItemSnapshotDTO[];
}
