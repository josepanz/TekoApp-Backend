/**
 * Fila cruda devuelta por `SELECT *` en `LocationsDbService.findNearby` ($queryRaw, Haversine).
 * Nunca pasa por el `$extends` de Prisma (solo aplica a las queries del query builder) — llega
 * con los nombres de columna reales de Postgres (snake_case) y los `NUMERIC` como string, no
 * number. `LocationsService.findNearbyProfessionals` mapea esto a `NearbyProfessionalResponseDTO`
 * antes de exponerlo — nunca devolver esta fila cruda por HTTP.
 */
export interface NearbyProfessionalRow {
  id: number;
  reference_id: string;
  category_id: number;
  description: string;
  hourly_rate: string;
  current_latitude: string;
  current_longitude: string;
  is_available: boolean;
  is_online: boolean;
  average_rating: string;
  distance: number;
}
