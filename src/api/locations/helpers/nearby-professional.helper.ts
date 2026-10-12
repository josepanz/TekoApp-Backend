import { NearbyProfessionalRow } from '@/modules/professional-position-db/interfaces/nearby-professional-row.interface';
import { NearbyProfessionalResponseDTO } from '../dtos/response/nearby-professional-response.dto';
import {
  haversineKm,
  obfuscateCoordinates,
} from './location-obfuscation.helper';

/**
 * Mapea la fila cruda a la respuesta pública. La coordenada exacta NUNCA sale de acá: se
 * devuelve la posición ofuscada y `distanceKm` se recalcula sobre ella (el `distance` exacto de
 * la fila SQL se descarta, porque permitiría triangular la posición real).
 */
export function mapNearbyProfessionalRow(
  row: NearbyProfessionalRow,
  origin: { latitude: number; longitude: number },
  secret: string,
  now: Date = new Date(),
): NearbyProfessionalResponseDTO {
  const approx = obfuscateCoordinates(
    Number(row.current_latitude),
    Number(row.current_longitude),
    row.id,
    secret,
    now,
  );
  return {
    id: row.id,
    referenceId: row.reference_id,
    categoryId: row.category_id,
    description: row.description,
    hourlyRate: Number(row.hourly_rate),
    latitude: approx.latitude,
    longitude: approx.longitude,
    distanceKm:
      Math.round(
        haversineKm(
          origin.latitude,
          origin.longitude,
          approx.latitude,
          approx.longitude,
        ) * 100,
      ) / 100,
    isAvailable: row.is_available,
    isOnline: row.is_online,
    averageRating: Number(row.average_rating),
  };
}
