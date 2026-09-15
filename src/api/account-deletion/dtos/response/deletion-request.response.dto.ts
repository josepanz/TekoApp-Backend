import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class DeletionRequestResponseDTO {
  @ApiProperty({ enum: UserStatus, example: UserStatus.PENDING_DELETION })
  status!: UserStatus;

  @ApiProperty()
  deletionRequestedAt!: Date;

  @ApiProperty({
    description:
      'Fecha en la que se anonimizará la cuenta si no se cancela antes.',
  })
  deletionScheduledAt!: Date;
}
