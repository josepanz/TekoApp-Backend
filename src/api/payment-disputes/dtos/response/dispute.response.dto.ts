import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DisputeReason,
  DisputeResolution,
  DisputeStatus,
} from '@prisma/client';
import { DisputePartyResponseDTO } from './dispute-party.response.dto';

export class DisputeResponseDTO {
  @ApiProperty({ description: 'referenceId (UUID) público de la disputa' })
  referenceId!: string;

  @ApiProperty({ description: 'referenceId (UUID) del pago disputado' })
  paymentReferenceId!: string;

  @ApiProperty({ enum: DisputeReason })
  reason!: DisputeReason;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: [String] })
  evidenceKeys!: string[];

  @ApiProperty({ enum: DisputeStatus })
  status!: DisputeStatus;

  @ApiProperty({ type: DisputePartyResponseDTO })
  openedBy!: DisputePartyResponseDTO;

  @ApiPropertyOptional({ type: DisputePartyResponseDTO })
  adjudicatedBy!: DisputePartyResponseDTO | null;

  @ApiPropertyOptional({ enum: DisputeResolution })
  resolution!: DisputeResolution | null;

  @ApiPropertyOptional()
  resolutionNotes!: string | null;

  @ApiPropertyOptional({
    description: 'Solo si resolution es FULL_REFUND/PARTIAL_REFUND',
  })
  refundAmount!: number | null;

  @ApiPropertyOptional()
  resolvedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;
}
