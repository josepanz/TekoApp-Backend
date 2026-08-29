import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceProgressEntryResponseDTO {
  @ApiProperty({ description: 'referenceId (UUID) público de la entrada' })
  referenceId!: string;

  @ApiPropertyOptional()
  note!: string | null;

  @ApiProperty({ type: [String] })
  images!: string[];

  @ApiProperty({ description: 'Orden de la entrada dentro del servicio' })
  entryOrder!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({
    description:
      'true si ya venció la ventana de corrección (no se puede eliminar) — calculado contra la ' +
      'hora del servidor al momento de la respuesta, no persistido.',
  })
  editWindowExpired!: boolean;
}
