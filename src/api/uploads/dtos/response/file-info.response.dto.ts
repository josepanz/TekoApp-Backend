import { ApiProperty } from '@nestjs/swagger';

export class FileInfoResponseDTO {
  @ApiProperty({ description: 'Nombre único del archivo en el sistema' })
  filename!: string;

  @ApiProperty({ description: 'Nombre original del archivo' })
  originalname!: string;

  @ApiProperty({ description: 'Tipo MIME del archivo' })
  mimetype!: string;

  @ApiProperty({ description: 'Tamaño en bytes' })
  size!: number;

  @ApiProperty({
    description: 'Clave del objeto en S3',
    example: 'a1b2c3d4.jpg',
  })
  key!: string;

  @ApiProperty({
    description: 'URL presignada para acceso inmediato al archivo',
  })
  url!: string;
}
