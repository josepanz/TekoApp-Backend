import { ApiProperty } from '@nestjs/swagger';

/// Identifica a una de las partes de una disputa (quién la abrió / quién la adjudicó) sin
/// exponer el `id` numérico interno — mismo criterio que el resto del repo (`referenceId` es la
/// única clave pública).
export class DisputePartyResponseDTO {
  @ApiProperty()
  referenceId!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;
}
