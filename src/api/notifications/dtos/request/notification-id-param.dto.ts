import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationIdParamDTO {
  @ApiProperty({
    description: 'Identificador único de la notificación (MongoDB ObjectId)',
    example: '6481fc923fbc4a3a6c23e801',
  })
  @IsMongoId()
  readonly id!: string;
}
