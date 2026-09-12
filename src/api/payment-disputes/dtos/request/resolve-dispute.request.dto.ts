import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeResolution } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const REFUND_RESOLUTIONS: DisputeResolution[] = [
  DisputeResolution.FULL_REFUND,
  DisputeResolution.PARTIAL_REFUND,
];

export class ResolveDisputeRequestDTO {
  @ApiProperty({ enum: DisputeResolution })
  @IsEnum(DisputeResolution)
  resolution!: DisputeResolution;

  @ApiProperty({
    description: 'Motivo de la adjudicación, visible en el registro contable',
    example: 'Se verificó con el profesional: el reclamo es procedente',
  })
  @IsString()
  @MinLength(5)
  resolutionNotes!: string;

  @ApiPropertyOptional({
    description:
      'Obligatorio si resolution es FULL_REFUND o PARTIAL_REFUND. Validado también por ' +
      'PaymentDbService.executeRefund contra el monto disponible del pago.',
    example: 100.0,
  })
  @ValidateIf((dto: ResolveDisputeRequestDTO) =>
    REFUND_RESOLUTIONS.includes(dto.resolution),
  )
  @IsNumber()
  @Min(0.01)
  refundAmount?: number;
}
