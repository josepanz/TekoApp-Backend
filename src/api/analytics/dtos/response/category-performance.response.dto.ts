// src/api/analytics/dtos/response/category-performance.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

class CategoryPerformanceItemDTO {
  @ApiProperty({ example: 'Plomería' }) category!: string;
  @ApiProperty({ example: 140 }) serviceCount!: number;
  @ApiProperty({ example: 18500000 }) revenue!: number;
  @ApiProperty({ example: 4.8 }) averageRating!: number;
}

export class CategoryPerformanceResponseDTO {
  @ApiProperty() success!: boolean;
  @ApiProperty({ type: [CategoryPerformanceItemDTO] })
  data!: CategoryPerformanceItemDTO[];
}
