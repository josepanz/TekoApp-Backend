import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PromotionIdParamDTO {
  @ApiProperty({
    description: 'ID UUID de la promoción',
    example: 'a63b5212-db5e-4ef5-9614-726614174000',
  })
  @IsUUID('4')
  id!: string;
}
