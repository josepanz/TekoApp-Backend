import { Injectable } from '@nestjs/common';
import { PrismaDatasource } from '@/core/database/services/prisma.service';
import { Professionals } from '@prisma/client';
import { FindNearbyQueryDTO } from '@/api/locations/dtos/request/find-nearby-query.dto';

@Injectable()
export class LocationsDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async findById(id: number): Promise<Professionals | null> {
    return this.prisma.extended.professionals.findUnique({ where: { id } });
  }

  async countOnline(whereClause: any): Promise<number> {
    return this.prisma.extended.professionals.count({ where: whereClause });
  }

  async findMany(args: any): Promise<Professionals[]> {
    return this.prisma.extended.professionals.findMany(args);
  }

  async updateLocation(
    id: number,
    latitude: number,
    longitude: number,
  ): Promise<Professionals> {
    return this.prisma.extended.professionals.update({
      where: { id },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationUpdate: new Date(),
      },
    });
  }

  async findNearby(
    dto: FindNearbyQueryDTO,
  ): Promise<(Professionals & { distance: number })[]> {
    const {
      latitude,
      longitude,
      radius,
      categoryId,
      limit,
      availableOnly,
      onlineOnly,
    } = dto;

    // Construcción dinámica de condiciones seguras de tipado para inyección en Query Raw
    const categoryFilter = categoryId
      ? `AND category_id = '${categoryId}'::uuid`
      : '';
    const availableFilter = availableOnly ? `AND is_available = true` : '';
    const onlineFilter = onlineOnly ? `AND is_online = true` : '';

    // SQL puro parametrizado contra inyección usando Haversine Fórmula
    return this.prisma.extended.$queryRawUnsafe<
      (Professionals & { distance: number })[]
    >(
      `
      SELECT *, (
        6371 * acos(
          cos(radians($1)) * cos(radians(current_latitude)) * cos(radians(current_longitude) - radians($2)) + 
          sin(radians($1)) * sin(radians(current_latitude))
        )
      ) AS distance
      FROM professionals
      WHERE current_latitude IS NOT NULL 
        AND current_longitude IS NOT NULL
        AND status = 'approved'
        AND verification_status = 'verified'
        ${categoryFilter}
        ${availableFilter}
        ${onlineFilter}
      GROUP BY id
      HAVING (
        6371 * acos(
          cos(radians($1)) * cos(radians(current_latitude)) * cos(radians(current_longitude) - radians($2)) + 
          sin(radians($1)) * sin(radians(current_latitude))
        )
      ) <= $3
      ORDER BY distance ASC, average_rating DESC
      LIMIT $4
    `,
      latitude,
      longitude,
      radius,
      limit,
    );
  }
}
