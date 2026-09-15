import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class DeletionCancelResponseDTO {
  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status!: UserStatus;
}
