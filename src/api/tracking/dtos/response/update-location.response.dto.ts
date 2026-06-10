// src/api/tracking/dtos/response/update-location.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationResponseDTO {
  @ApiProperty({
    description: 'Indica el estado exitoso de la operación',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Mensaje de confirmación del procesamiento',
    example: 'Ubicación procesada con éxito',
  })
  message!: string;
}
