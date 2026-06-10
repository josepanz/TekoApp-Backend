import { ApiProperty } from '@nestjs/swagger';

export class ServiceStatsResponseDTO {
  @ApiProperty({ example: 15 })
  total!: number;

  @ApiProperty({ example: 5 })
  pending!: number;

  @ApiProperty({ example: 3 })
  inProgress!: number;

  @ApiProperty({ example: 6 })
  completed!: number;

  @ApiProperty({ example: 1 })
  cancelled!: number;

  @ApiProperty({ example: 750000 })
  totalEarnings!: number;
}
