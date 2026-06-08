import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsInt } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  email!: string;

  @ApiProperty({ description: 'Nombre del usuario', example: 'Juan' })
  @IsString()
  firstName!: string;

  @ApiProperty({ description: 'Apellido del usuario', example: 'Pérez' })
  @IsString()
  lastName!: string;

  @ApiProperty({ description: 'ID del tipo de documento', example: 1 })
  @IsInt()
  documentTypeId!: number;

  @ApiProperty({ description: 'Nivel de acceso', example: 1 })
  @IsInt()
  access_level!: number;

  @ApiProperty({ description: 'Creado por (referencia)', example: 'system' })
  @IsString()
  createdBy!: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono',
    example: '+595991234567',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Número de documento',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  documentNumber?: string;
}
