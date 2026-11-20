import { IsBoolean, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';

export class VerifyProfessionalRequestDTO {
  @ApiProperty({
    description: 'true = verificado, false = rechazado',
    example: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isVerified!: boolean;

  @ApiPropertyOptional({
    description:
      'Nota del proceso de verificación. Opcional al verificar (isVerified=true), obligatoria al rechazar (isVerified=false). Queda en la auditoría.',
    example: 'Documentos válidos',
  })
  // Trim; una nota en blanco al verificar equivale a no enviarla (al rechazar sigue siendo 400).
  @Transform(({ value, obj }: TransformFnParams): unknown => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    const verifying = (obj as { isVerified?: unknown }).isVerified;
    return trimmed === '' && (verifying === true || verifying === 'true')
      ? undefined
      : trimmed;
  })
  @ValidateIf(
    (dto: VerifyProfessionalRequestDTO) =>
      dto.isVerified === false || dto.notes !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  notes?: string;
}
