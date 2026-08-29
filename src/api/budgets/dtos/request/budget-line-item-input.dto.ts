import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetLineItemType } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class BudgetLineItemInputDTO {
  @ApiProperty({ enum: BudgetLineItemType })
  @IsEnum(BudgetLineItemType)
  itemType!: BudgetLineItemType;

  @ApiPropertyOptional({
    description: 'referenceId de MaterialCatalog — omitir si es un ítem libre',
  })
  @IsOptional()
  @IsUUID('4')
  catalogItemReferenceId?: string;

  @ApiProperty({ example: 'Cerámica esmaltada 30x30' })
  @IsString()
  @MaxLength(255)
  description!: string;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @ApiProperty({
    description:
      'Precio unitario — puede diferir del defaultPrice del catálogo (es solo sugerido)',
    example: 45000,
  })
  @IsNumber()
  @Min(0)
  unitPrice!: number;
}
