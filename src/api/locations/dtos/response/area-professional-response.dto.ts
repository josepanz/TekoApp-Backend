import { OmitType } from '@nestjs/swagger';
import { NearbyProfessionalResponseDTO } from './nearby-professional-response.dto';

/** `GET /locations/area` — mismo shape que `nearby` sin distancia; posición aproximada. */
export class AreaProfessionalResponseDTO extends OmitType(
  NearbyProfessionalResponseDTO,
  ['distanceKm'] as const,
) {}
