import { ApiProperty } from '@nestjs/swagger';

export class ContractPdfResponseDTO {
  @ApiProperty({
    description:
      'URL presignada al PDF firmado, expira según S3_PRESIGNED_URL_EXPIRES_IN',
  })
  url!: string;
}
