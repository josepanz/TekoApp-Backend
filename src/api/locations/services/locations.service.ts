import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocationsDbService } from '@/modules/locations-db/services/locations-db.service';
import { UpdateLocationRequestDTO } from '../dtos/request/update-location-request.dto';
import { FindNearbyQueryDTO } from '../dtos/request/find-nearby-query.dto';
import { ProfessionalLocationResponseDTO } from '../dtos/response/professional-location-response.dto';
import { GetProfessionalsAreaQueryDTO } from '../dtos/request/get-professionals-area-query.dto';
import { CalculateDistanceQueryDTO } from '../dtos/request/calculate-distance-query.dto';
import { Professionals } from '@prisma/client';

@Injectable()
export class LocationsService {
  constructor(
    private readonly locationsDb: LocationsDbService,
    private readonly configService: ConfigService,
  ) {}

  async updateLocation(
    professionalId: number,
    dto: UpdateLocationRequestDTO,
  ): Promise<Professionals> {
    const professional = await this.locationsDb.findById(professionalId);
    if (!professional) {
      throw new NotFoundException(
        'Profesional no encontrado en los registros maestros',
      );
    }
    return this.locationsDb.updateLocation(
      professionalId,
      dto.latitude,
      dto.longitude,
    );
  }

  async findNearbyProfessionals(
    dto: FindNearbyQueryDTO,
  ): Promise<(Professionals & { distance: number })[]> {
    const maxConfigRadius = this.configService.get<number>('MAX_RADIUS_KM', 50);
    const checkedRadius = Math.min(dto.radius, maxConfigRadius);

    return this.locationsDb.findNearby({
      ...dto,
      radius: checkedRadius,
    });
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
        'El profesional solicitado no posee coordenadas activas de posicionamiento',
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
      status: 'approved',
      verificationStatus: 'verified',
    });
  }

  async getProfessionalsByArea(
    dto: GetProfessionalsAreaQueryDTO,
  ): Promise<Professionals[]> {
    return this.locationsDb.findMany({
      where: {
        currentLatitude: { gte: dto.minLat, lte: dto.maxLat },
        currentLongitude: { gte: dto.minLng, lte: dto.maxLng },
        isAvailable: true,
        isOnline: true,
      },
    });
  }

  async calculateDistance(dto: CalculateDistanceQueryDTO): Promise<number> {
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
