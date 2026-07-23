import { ApiProperty } from '@nestjs/swagger';

export class ServiceTypeResponseDTO {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Instalación' })
  name!: string;
}
