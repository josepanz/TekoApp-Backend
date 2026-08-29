import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * "Firma": nombre completo tipeado + checkbox de aceptación explícita — no una firma digital
 * calificada. El hash de evidencia se genera server-side (ver `ContractsService.signContract`),
 * nunca lo manda el cliente.
 */
export class SignContractRequestDTO {
  @ApiProperty({ description: 'Nombre completo tipeado por quien firma' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName!: string;

  @ApiProperty({
    description:
      'Checkbox "Leí y acepto el contenido de este contrato" — debe venir en true',
  })
  @IsBoolean()
  accepted!: boolean;
}
