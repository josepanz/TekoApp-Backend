import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CurrencyCodeParamDTO {
  @ApiProperty({
    description: 'Código alfabético ISO 4217 (3 letras)',
    example: 'PYG',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsString()
  @Length(3, 3)
  alphaCode!: string;
}
