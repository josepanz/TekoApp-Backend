// src/api/tracking/services/tracking.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TrackingDbService } from '@modules/tracking-db/services/tacking-db.service';
import { UpdateLocationRequestDTO } from '../dtos/request/update-location.request.dto';
import { UpdateLocationResponseDTO } from '../dtos/response/update-location.response.dto';
import { GetNearbyProfessionalsRequestDTO } from '../dtos/request/get-nearby-professionals.request.dto';
import { GetNearbyProfessionalsResponseDTO } from '../dtos/response/get-nearby-professionals.response.dto';

@Injectable()
export class TrackingApiService {
  private readonly logger = new Logger(TrackingApiService.name);

  constructor(
    private readonly trackingDbService: TrackingDbService,
    private readonly configService: ConfigService,
  ) {}

  async processLocationPing(
    dto: UpdateLocationRequestDTO,
  ): Promise<UpdateLocationResponseDTO> {
    await this.trackingDbService.saveLocationPing({
      professionalId: dto.professionalId,
      serviceId: dto.serviceId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      heading: dto.heading,
      speed: dto.speed,
    });

    const response = new UpdateLocationResponseDTO();
    response.success = true;
    response.message = 'Ubicación procesada con éxito';
    return response;
  }

  async getNearbyProviders(
    query: GetNearbyProfessionalsRequestDTO,
  ): Promise<GetNearbyProfessionalsResponseDTO> {
    const defaultRadius =
      this.configService.get<number>('config.geolocation.defaultRadiusKm') ??
      10;
    const radiusInKm = query.radiusKm ?? defaultRadius;
    const radiusInMeters = radiusInKm * 1000;

    // Aquí se resuelve limpiamente la asignación gracias al casteo del módulo base
    const locations = await this.trackingDbService.findInRadius(
      query.latitude,
      query.longitude,
      radiusInMeters,
    );

    const response = new GetNearbyProfessionalsResponseDTO();
    response.success = true;
    response.meta = {
      radiusAppliedKm: radiusInKm,
      resultsCount: locations.length,
    };

    // El compilador de TypeScript ahora autocompleta sin errores
    response.data = locations.map((loc) => ({
      professionalId: loc.professionalId,
      location: {
        type: loc.location.type,
        coordinates: loc.location.coordinates,
      },
      createdAt: loc.createdAt,
      heading: loc.heading,
      speed: loc.speed,
    }));

    return response;
  }
}
