import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractStatus } from '@prisma/client';
import { ContractContentSnapshotDTO } from './contract-content-snapshot.response.dto';
import { LegalTermsVersionSummaryDTO } from './legal-terms-version-summary.response.dto';

export class ContractResponseDTO {
  @ApiProperty({ description: 'referenceId (UUID) público' })
  referenceId!: string;

  @ApiProperty({ enum: ContractStatus })
  status!: ContractStatus;

  @ApiProperty({
    enum: ['CLIENT', 'PROFESSIONAL'],
    description:
      'Rol de quien pide el contrato — permite a mobile/web mostrar "pendiente de tu firma" vs. "pendiente de la firma de la otra parte" sin exponer clientUserId/professionalId.',
  })
  viewerRole!: 'CLIENT' | 'PROFESSIONAL';

  @ApiProperty({ type: ContractContentSnapshotDTO })
  contentSnapshot!: ContractContentSnapshotDTO;

  @ApiPropertyOptional({
    type: LegalTermsVersionSummaryDTO,
    description:
      'null si todavía no hay ninguna versión publicada de este tipo',
  })
  legalTermsVersion!: LegalTermsVersionSummaryDTO | null;

  @ApiPropertyOptional()
  clientSignedAt!: Date | null;

  @ApiPropertyOptional()
  professionalSignedAt!: Date | null;

  @ApiProperty({ description: 'true solo cuando status = SIGNED' })
  pdfAvailable!: boolean;
}
