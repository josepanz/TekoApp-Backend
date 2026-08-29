import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractStatus } from '@prisma/client';

/// Fila de `GET /admin/contracts` — listado para soporte/disputas legales, sin el snapshot
/// completo (ver `ContractResponseDTO` para el detalle vía `GET /contracts/:referenceId`).
export class ContractAuditResponseDTO {
  @ApiProperty()
  referenceId!: string;

  @ApiProperty({ enum: ContractStatus })
  status!: ContractStatus;

  @ApiProperty()
  serviceReferenceId!: string;

  @ApiProperty()
  clientReferenceId!: string;

  @ApiProperty()
  professionalReferenceId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  clientSignedAt!: Date | null;

  @ApiPropertyOptional()
  professionalSignedAt!: Date | null;

  @ApiProperty()
  pdfAvailable!: boolean;
}
