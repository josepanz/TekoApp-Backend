import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProfessionalPositionDbService } from '@/modules/professional-position-db/services/professional-position-db.service';
import { UpdateLocationRequestDTO } from '../dtos/request/update-location-request.dto';
import { FindNearbyQueryDTO } from '../dtos/request/find-nearby-query.dto';
import { ProfessionalLocationResponseDTO } from '../dtos/response/professional-location-response.dto';
import { NearbyProfessionalResponseDTO } from '../dtos/response/nearby-professional-response.dto';
import { mapNearbyProfessionalRow } from '../helpers/nearby-professional.helper';
import { GetProfessionalsAreaQueryDTO } from '../dtos/request/get-professionals-area-query.dto';
import { CalculateDistanceQueryDTO } from '../dtos/request/calculate-distance-query.dto';
import { Professionals, VerificationStatus } from '@prisma/client';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { AreaProfessionalResponseDTO } from '../dtos/response/area-professional-response.dto';
import { obfuscateCoordinates } from '../helpers/location-obfuscation.helper';

import { t } from '@common/i18n/i18n.helper';
@Injectable()
export class LocationsService {
  constructor(
    private readonly locationsDb: ProfessionalPositionDbService,
    private readonly configService: ConfigService,
  ) {}

  async updateLocation(
    professionalId: number,
    dto: UpdateLocationRequestDTO,
  ): Promise<Professionals> {
    const professional = await this.locationsDb.findById(professionalId);
    if (!professional) {
      throw new NotFoundException(t('locations.PROFESSIONAL_NOT_FOUND'));
    }
    return this.locationsDb.updateLocation(
      professionalId,
      dto.latitude,
      dto.longitude,
    );
  }

  async setOnlineStatus(
    userReferenceId: string,
    isOnline: boolean,
  ): Promise<Professionals> {
    const professionalId =
      await this.resolveProfessionalIdByUserRef(userReferenceId);
    return this.locationsDb.setOnlineStatus(professionalId, isOnline);
  }

  // Resuelve el `id` interno del Professional a partir del `referenceId` del User autenticado
  // (el JWT nunca trae `professionalId` — ver LocationsController/LocationsGateway, que antes
  // confiaban en un campo que jamás existe en el payload real).
  async resolveProfessionalIdByUserRef(
    userReferenceId: string,
  ): Promise<number> {
    const professional =
      await this.locationsDb.findByUserReferenceId(userReferenceId);
    if (!professional) {
      throw new NotFoundException(t('locations.PROFESSIONAL_NOT_FOUND'));
    }
    return professional.id;
  }

  async findNearbyProfessionals(
    dto: FindNearbyQueryDTO,
  ): Promise<NearbyProfessionalResponseDTO[]> {
    const maxConfigRadius = this.configService.get<number>('MAX_RADIUS_KM', 50);
    const checkedRadius = Math.min(dto.radius, maxConfigRadius);

    // Solo profesionales en línea, sin importar lo que mande el cliente en `onlineOnly`.
    const rows = await this.locationsDb.findNearby({
      ...dto,
      radius: checkedRadius,
      onlineOnly: true,
    });
    const now = new Date();
    const secret = this.obfuscationSecret();
    const origin = { latitude: dto.latitude, longitude: dto.longitude };
    return rows.map((row) =>
      mapNearbyProfessionalRow(row, origin, secret, now),
    );
  }

  private obfuscationSecret(): string {
    return (
      this.configService.get<string>('LOCATION_OBFUSCATION_SECRET') ||
      this.configService.get<string>('JWT_PRIVATE_KEY') ||
      'teko-location-obfuscation'
    );
  }

  /**
   * Coordenada exacta: solo (i) el propio profesional, (ii) admin, (iii) cliente con servicio
   * ACCEPTED/IN_PROGRESS con ese profesional. `knownPermissions` (HTTP: ya cargados por
   * JwtStrategy); sin él (WS: el payload del JWT no trae permisos) se consulta la DB.
   */
  async canViewExactLocation(
    requesterReferenceId: string,
    professionalId: number,
    knownPermissions?: string[],
  ): Promise<boolean> {
    const isAdmin = knownPermissions
      ? knownPermissions.includes(PERMISSIONS.ADMIN.ALL)
      : await this.locationsDb.userHasPermission(
          requesterReferenceId,
          PERMISSIONS.ADMIN.ALL,
        );
    if (isAdmin) return true;

    const own =
      await this.locationsDb.findByUserReferenceId(requesterReferenceId);
    if (own && own.id === professionalId) return true;

    return this.locationsDb.hasActiveServiceWith(
      requesterReferenceId,
      professionalId,
    );
  }

  async assertCanViewExactLocation(
    requesterReferenceId: string,
    professionalId: number,
    knownPermissions?: string[],
  ): Promise<void> {
    const allowed = await this.canViewExactLocation(
      requesterReferenceId,
      professionalId,
      knownPermissions,
    );
    if (!allowed) {
      throw new ForbiddenException(t('locations.EXACT_LOCATION_FORBIDDEN'));
    }
  }

  /** Posición ofuscada para emitir por el canal global (mismo algoritmo que `nearby`). */
  approximate(
    professionalId: number,
    latitude: number,
    longitude: number,
  ): { latitude: number; longitude: number } {
    return obfuscateCoordinates(
      latitude,
      longitude,
      professionalId,
      this.obfuscationSecret(),
    );
  }

  async getProfessionalLocation(
    professionalId: number,
  ): Promise<ProfessionalLocationResponseDTO> {
    const professional = await this.locationsDb.findById(professionalId);
    if (
      !professional ||
      !professional.currentLatitude ||
      !professional.currentLongitude
    ) {
      throw new NotFoundException(
        t('locations.PROFESSIONAL_WITHOUT_COORDINATES'),
      );
    }

    return {
      latitude: Number(professional.currentLatitude),
      longitude: Number(professional.currentLongitude),
      lastUpdate: professional.lastLocationUpdate,
    };
  }

  async getOnlineProfessionalsCount(): Promise<number> {
    return this.locationsDb.countOnline({
      isOnline: true,
      isAvailable: true,
      status: 'APPROVED',
      verificationStatus: VerificationStatus.VERIFIED,
    });
  }

  async getProfessionalsByArea(
    dto: GetProfessionalsAreaQueryDTO,
  ): Promise<AreaProfessionalResponseDTO[]> {
    const rows = await this.locationsDb.findMany({
      where: {
        currentLatitude: { gte: dto.minLat, lte: dto.maxLat },
        currentLongitude: { gte: dto.minLng, lte: dto.maxLng },
        isAvailable: true,
        isOnline: true,
        status: 'APPROVED',
        verificationStatus: VerificationStatus.VERIFIED,
      },
    });
    const secret = this.obfuscationSecret();
    const now = new Date();
    // Mapeo explícito (allowlist): antes se devolvía la entidad Professionals completa.
    return rows.map((p) => {
      const approx = obfuscateCoordinates(
        Number(p.currentLatitude),
        Number(p.currentLongitude),
        p.id,
        secret,
        now,
      );
      return {
        id: p.id,
        referenceId: p.referenceId,
        categoryId: p.categoryId,
        description: p.description,
        hourlyRate: Number(p.hourlyRate),
        latitude: approx.latitude,
        longitude: approx.longitude,
        isAvailable: p.isAvailable,
        isOnline: p.isOnline,
        averageRating: Number(p.averageRating),
      };
    });
  }

  calculateDistance(dto: CalculateDistanceQueryDTO): number {
    const R = 6371; // Radio planetario estándar en KM
    const dLat = this.toRadians(dto.lat2 - dto.lat1);
    const dLng = this.toRadians(dto.lng2 - dto.lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(dto.lat1)) *
        Math.cos(this.toRadians(dto.lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
