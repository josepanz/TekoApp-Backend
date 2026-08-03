import { ApiProperty } from '@nestjs/swagger';
import { DeviceType } from '@prisma/client';

export class FcmTokenResponseDTO {
  @ApiProperty({
    description: 'Identificador público del token',
    example: 'a3f1e9b2-4c3d-4e5f-8a9b-1c2d3e4f5a6b',
  })
  readonly referenceId!: string;

  @ApiProperty({ description: 'Plataforma del dispositivo', enum: DeviceType })
  readonly deviceType!: DeviceType;

  @ApiProperty({ description: 'Fecha de registro del token' })
  readonly createdAt!: Date;
}
