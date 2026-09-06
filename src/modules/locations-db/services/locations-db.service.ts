import { Injectable } from '@nestjs/common';
import { PrismaDatasource } from '@/core/database/services/prisma.service';
import {
  Prisma,
  Professionals,
  ProfessionalStatus,
  VerificationStatus,
} from '@prisma/client';
import { FindNearbyQueryDTO } from '@/api/locations/dtos/request/find-nearby-query.dto';
import { NearbyProfessionalRow } from '../interfaces/nearby-professional-row.interface';

@Injectable()
export class LocationsDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async findById(id: number): Promise<Professionals | null> {
    return this.prisma.extended.professionals.findUnique({ where: { id } });
  }

  async setOnlineStatus(id: number, isOnline: boolean): Promise<Professionals> {
    return this.prisma.extended.professionals.update({
      where: { id },
      data: { isOnline },
    });
  }

  async findByUserReferenceId(
    userReferenceId: string,
  ): Promise<{ id: number } | null> {
    return this.prisma.extended.professionals.findFirst({
      where: { user: { referenceId: userReferenceId } },
      select: { id: true },
    });
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

  async findNearby(dto: FindNearbyQueryDTO): Promise<NearbyProfessionalRow[]> {
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

    // `status` es un enum nativo de Postgres (`ProfessionalStatus`, valores en MAYÚSCULA —
    // PENDING/APPROVED/REJECTED/SUSPENDED, ver prisma/schema.prisma). Un valor bindeado como
    // parámetro normal acá falla en runtime (`42883: operator does not exist: "ProfessionalStatus"
    // = text`, Postgres no castea implícito un parámetro tipado text contra un enum); tiene que
    // viajar como literal de texto sin tipo declarado, que Postgres SÍ resuelve solo. Por eso
    // `Prisma.raw` en vez de una interpolación común — seguro acá porque el valor sale de la
    // constante tipada de nuestro propio código, nunca de input de usuario.
    //
    // Bug real que esto corrige: la query anterior tenía hardcodeado `status = 'approved'`
    // (string suelto, minúscula) — no calzaba con ningún valor real del enum, así que
    // `GET /locations/nearby` tiraba 500 contra Postgres real en producción. Ningún test
    // unitario lo detectaba porque todos mockean `$queryRaw`.
    const approvedStatus = Prisma.raw(`'${ProfessionalStatus.APPROVED}'`);
    // T-02 (WORKPLAN platform-hardening-2026-09): `verificationStatus` pasó de texto libre a
    // enum nativo de Postgres — mismo motivo que `approvedStatus` arriba, mismo patrón.
    const verifiedStatus = Prisma.raw(`'${VerificationStatus.VERIFIED}'`);

    // SQL parametrizado (tagged template) usando Haversine Fórmula
    return this.prisma.extended.$queryRaw<NearbyProfessionalRow[]>`
      SELECT *, (
        6371 * acos(
          cos(radians(${latitude})) * cos(radians(current_latitude)) * cos(radians(current_longitude) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(current_latitude))
        )
      ) AS distance
      FROM professionals
      WHERE current_latitude IS NOT NULL
        AND current_longitude IS NOT NULL
        AND status = ${approvedStatus}
        AND verification_status = ${verifiedStatus}
        ${categoryFilter}
        ${availableFilter}
        ${onlineFilter}
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
