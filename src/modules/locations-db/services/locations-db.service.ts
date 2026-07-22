import { Injectable } from '@nestjs/common';
import { PrismaDatasource } from '@/core/database/services/prisma.service';
import { Prisma, Professionals } from '@prisma/client';
import { FindNearbyQueryDTO } from '@/api/locations/dtos/request/find-nearby-query.dto';

@Injectable()
export class LocationsDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async findById(id: number): Promise<Professionals | null> {
    return this.prisma.extended.professionals.findUnique({ where: { id } });
  }

  async countOnline(
    whereClause: Prisma.ProfessionalsWhereInput,
  ): Promise<number> {
    return this.prisma.extended.professionals.count({ where: whereClause });
  }

  async findMany(
    args: Prisma.ProfessionalsFindManyArgs,
  ): Promise<Professionals[]> {
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

    // Fragmentos parametrizados vía Prisma.sql — nunca interpolación de string cruda
    const categoryFilter = categoryId
      ? Prisma.sql`AND category_id = ${categoryId}`
      : Prisma.empty;
    const availableFilter = availableOnly
      ? Prisma.sql`AND is_available = true`
      : Prisma.empty;
    const onlineFilter = onlineOnly
      ? Prisma.sql`AND is_online = true`
      : Prisma.empty;

    // SQL parametrizado (tagged template) usando Haversine Fórmula
    return this.prisma.extended.$queryRaw<
      (Professionals & { distance: number })[]
    >`
      SELECT *, (
        6371 * acos(
          cos(radians(${latitude})) * cos(radians(current_latitude)) * cos(radians(current_longitude) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(current_latitude))
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
          cos(radians(${latitude})) * cos(radians(current_latitude)) * cos(radians(current_longitude) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(current_latitude))
        )
      ) <= ${radius}
      ORDER BY distance ASC, average_rating DESC
      LIMIT ${limit}
    `;
  }
}
