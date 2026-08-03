import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDTO {
  @ApiProperty({
    example: 1,
    description: 'ID del rol',
  })
  id!: number;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'referenceId (UUID) público del rol',
  })
  referenceId!: string;

  @ApiProperty({
    example: 'MerchantAdmin',
    description: 'Nombre del rol',
  })
  name!: string;

  @ApiProperty({
    example: 'Administrador de comercio',
    description: 'Nombre en pantalla del rol',
  })
  displayName?: string | null;

  @ApiProperty({
    example: 'Administrador del comercio con acceso completo',
    description: 'Descripción del rol',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    example: true,
    description: 'Estado del rol',
  })
  isActive!: boolean;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Fecha de creación',
  })
  createdAt!: Date;

  @ApiProperty({
    example: 'admin@correo.com.py',
    description: 'Usuario que creó el rol',
  })
  createdBy!: string;

  @ApiProperty({
    example: '2024-01-20T14:45:00Z',
    description: 'Fecha de última modificación',
    nullable: true,
  })
  lastChangedAt!: Date | null;

  @ApiProperty({
    example: 'admin@correo.com.py',
    description: 'Usuario que modificó por última vez',
    nullable: true,
  })
  lastChangedBy!: string | null;
}
