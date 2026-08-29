import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { BudgetLineItemInputDTO } from './budget-line-item-input.dto';

export class BudgetOptionInputDTO {
  @ApiProperty({ example: 'Estándar' })
  @IsString()
  @MaxLength(100)
  label!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @ApiProperty({ type: [BudgetLineItemInputDTO] })
  @ValidateNested({ each: true })
  @Type(() => BudgetLineItemInputDTO)
  @ArrayMinSize(1)
  lineItems!: BudgetLineItemInputDTO[];
}
