// src/api/analytics/dtos/response/dashboard-stats.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

class UserStatsDTO {
  @ApiProperty({ example: 1500 }) total!: number;
  @ApiProperty({ example: 120 }) new!: number;
  @ApiProperty({ example: 450 }) active!: number;
  @ApiProperty({ description: 'Tasa de crecimiento porcentual', example: 12.5 })
  growth!: number;
}

class ProfessionalStatsDTO {
  @ApiProperty({ example: 350 }) total!: number;
  @ApiProperty({ example: 25 }) new!: number;
  @ApiProperty({ example: 310 }) verified!: number;
  @ApiProperty({ example: 5.4 }) growth!: number;
}

class ServiceStatsDetailsDTO {
  @ApiProperty({ example: 850 }) total!: number;
  @ApiProperty({ example: 45 }) active!: number;
  @ApiProperty({ example: 750 }) completed!: number;
  @ApiProperty({ example: 55 }) pending!: number;
  @ApiProperty({ example: 8.2 }) growth!: number;
}

class RevenueStatsDTO {
  @ApiProperty({ example: 25000000 }) total!: number;
  @ApiProperty({
    description: 'Facturación del periodo actual',
    example: 4500000,
  })
  period!: number;
  @ApiProperty({ description: 'Ticket promedio', example: 150000 })
  average!: number;
  @ApiProperty({ example: 15.3 }) growth!: number;
}

class RatingStatsDTO {
  @ApiProperty({ example: 4.7 }) average!: number;
  @ApiProperty({ example: 980 }) total!: number;
  @ApiProperty({ example: 120 }) period!: number;
  @ApiProperty({
    description: 'Mapeo de estrellas distribuidas',
    example: { '5 estrellas': 80, '4 estrellas': 15 },
  })
  distribution!: Record<string, number>;
}

class PeriodDTO {
  @ApiProperty({ example: '2026-05-01T00:00:00.000Z' }) startDate!: Date;
  @ApiProperty({ example: '2026-05-31T23:59:59.999Z' }) endDate!: Date;
}

export class DashboardStatsResponseDTO {
  @ApiProperty() success!: boolean;
  @ApiProperty() users!: UserStatsDTO;
  @ApiProperty() professionals!: ProfessionalStatsDTO;
  @ApiProperty() services!: ServiceStatsDetailsDTO;
  @ApiProperty() revenue!: RevenueStatsDTO;
  @ApiProperty() ratings!: RatingStatsDTO;
  @ApiProperty() period!: PeriodDTO;
}
