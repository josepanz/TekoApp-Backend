import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum MerchantDocTypeEnum {
  PAS = 'PAS',
  CAD = 'CAD',
  CIP = 'CIP',
  CIE = 'CIE',
  DNI = 'DNI',
  RUC = 'RUC',
  CRC = 'CRC',
}

export class UploadMerchantDocsRequestDTO {
  @ApiPropertyOptional({
    example: MerchantDocTypeEnum.CIP,
    description: 'Tipo de documento del merchant',
    enum: MerchantDocTypeEnum,
  })
  @IsString()
  @IsEnum(MerchantDocTypeEnum, {
    message: `El tipo de documento debe ser uno de: ${Object.values(MerchantDocTypeEnum).join(', ')}`,
  })
  @IsOptional()
  documentType?: string;

  @ApiPropertyOptional({
    example: '12345678',
    description: 'Número de documento del merchant',
  })
  @IsString()
  @IsOptional()
  documentNumber?: string;
}
