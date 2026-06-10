import { ApiProperty } from '@nestjs/swagger';
import { RatingDetailResponseDTO } from './rating-detail.response.dto';

export class RatingsListResponseDTO {
  @ApiProperty({
    description: 'Lista de calificaciones',
    type: [RatingDetailResponseDTO],
  })
  data!: RatingDetailResponseDTO[];
}
