import { NearbyProfessionalRow } from '@/modules/locations-db/interfaces/nearby-professional-row.interface';
import { NearbyProfessionalResponseDTO } from '../dtos/response/nearby-professional-response.dto';

export function mapNearbyProfessionalRow(
  row: NearbyProfessionalRow,
): NearbyProfessionalResponseDTO {
  return {
    id: row.id,
    referenceId: row.reference_id,
    categoryId: row.category_id,
    description: row.description,
    hourlyRate: Number(row.hourly_rate),
    latitude: Number(row.current_latitude),
    longitude: Number(row.current_longitude),
    distanceKm: Math.round(row.distance * 100) / 100,
    isAvailable: row.is_available,
    isOnline: row.is_online,
    averageRating: Number(row.average_rating),
  };
}
