import { ApiProperty } from '@nestjs/swagger';
import { DisputeResponseDTO } from './dispute.response.dto';

/// Historial de disputas de UN pago (`GET /payments/:id/disputes`) — sin paginar, mismo criterio
/// que `MyContractsListResponseDTO` (volumen bajo por pago).
export class DisputesListResponseDTO {
  @ApiProperty({ type: [DisputeResponseDTO] })
  data!: DisputeResponseDTO[];
}
