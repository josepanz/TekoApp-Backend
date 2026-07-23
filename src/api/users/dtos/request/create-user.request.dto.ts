import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsDate,
} from 'class-validator';
import { UserProfileStatus, UserStatus } from '@prisma/client';

export class CreateUserRequestDTO {
  @ApiProperty({
    example: 'user@example.com',
    description: 'El correo electrónico del usuario.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'John',
    description: 'El primer nombre del usuario.',
  })
  @IsString()
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
    description: 'El apellido del usuario.',
  })
  @IsString()
  lastName!: string;

  @ApiProperty({
    example: true,
    description: 'Indica si el usuario es un empleado.',
  })
  @IsBoolean()
  isEmployee!: boolean;

  @ApiProperty({
    example: false,
    description: 'Indica si el usuario está autenticado vía LDAP.',
  })
  @IsBoolean()
  isLdap!: boolean;

  @ApiProperty({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    description: 'El estado del usuario.',
  })
  @IsEnum(UserStatus)
  status!: UserStatus;

  @ApiProperty({
    example: '12345678',
    required: false,
    description: 'El número de documento del usuario.',
  })
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiProperty({
    example: '+595991234567',
    required: false,
    description: 'El número de teléfono del usuario.',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'El nivel de acceso del usuario.',
  })
  @IsOptional()
  accessLevelId?: number;

  @IsEnum(UserProfileStatus)
  @IsOptional()
  profileStatus?: UserProfileStatus;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'El tipo de documento usuario.',
  })
  @IsOptional()
  documentType?: number;

  @IsDate()
  @IsOptional()
  acceptedTermsAt?: Date;
}
