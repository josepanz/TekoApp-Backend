import { ApiProperty } from '@nestjs/swagger';
import { ContractStatus } from '@prisma/client';

/// Fila de `GET /contracts` (listado propio) — `serviceTitle` sale del `contentSnapshot` ya
/// congelado, sin necesidad de releer `Services` en vivo.
export class MyContractSummaryResponseDTO {
  @ApiProperty()
  referenceId!: string;

  @ApiProperty({ enum: ContractStatus })
  status!: ContractStatus;

  @ApiProperty()
  serviceTitle!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  pdfAvailable!: boolean;
}

export class MyContractsListResponseDTO {
  @ApiProperty({ type: [MyContractSummaryResponseDTO] })
  data!: MyContractSummaryResponseDTO[];
}
