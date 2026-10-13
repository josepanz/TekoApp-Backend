import { ApiProperty } from '@nestjs/swagger';
import { ProfessionalStatus } from '@prisma/client';
import { PaginationResponseDTO } from '@common/dtos/pagination.dto';

export const STATUS_HISTORY_ACTIONS = [
  'VERIFY',
  'REJECT',
  'SUSPEND',
  'REACTIVATE',
  'STATUS_CHANGE',
] as const;
export type StatusHistoryAction = (typeof STATUS_HISTORY_ACTIONS)[number];

export class StatusHistoryActorDTO {
  @ApiProperty({
    nullable: true,
    type: String,
    description:
      'referenceId del usuario que hizo el cambio (null si no quedó registrado)',
  })
  referenceId!: string | null;

  @ApiProperty({ nullable: true, type: String, example: 'Ada Lovelace' })
  name!: string | null;

  @ApiProperty({ nullable: true, type: String })
  email!: string | null;
}

export class ProfessionalStatusHistoryItemDTO {
  @ApiProperty({ description: 'id del registro de auditoría (string)' })
  id!: string;

  @ApiProperty({ enum: STATUS_HISTORY_ACTIONS })
  action!: StatusHistoryAction;

  @ApiProperty({ enum: ProfessionalStatus })
  fromStatus!: ProfessionalStatus;

  @ApiProperty({ enum: ProfessionalStatus })
  toStatus!: ProfessionalStatus;

  @ApiProperty({ nullable: true, type: String })
  reason!: string | null;

  @ApiProperty()
  changedAt!: Date;

  @ApiProperty({ type: StatusHistoryActorDTO })
  actor!: StatusHistoryActorDTO;

  @ApiProperty({ nullable: true, type: String })
  ipAddress!: string | null;

  @ApiProperty({ nullable: true, type: String })
  userAgent!: string | null;
}

export class ProfessionalStatusHistoryResponseDTO {
  @ApiProperty({ type: [ProfessionalStatusHistoryItemDTO] })
  data!: ProfessionalStatusHistoryItemDTO[];

  @ApiProperty({ type: PaginationResponseDTO })
  pagination!: PaginationResponseDTO;
}
