import { ApiProperty } from '@nestjs/swagger';

export class ProfessionalStatsResponseDTO {
  @ApiProperty({ example: 42 })
  totalServices!: number;

  @ApiProperty({ example: 38 })
  completedServices!: number;

  @ApiProperty({ example: 5700000 })
  totalEarnings!: number;

  @ApiProperty({ example: 4.8 })
  averageRating!: number;

  @ApiProperty({ example: 35 })
  totalRatings!: number;
}
