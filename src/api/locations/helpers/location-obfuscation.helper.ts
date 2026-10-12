import { createHmac } from 'crypto';

/**
 * Ofuscación de la posición de un profesional para respuestas que NO requieren la coordenada
 * exacta (`GET /locations/nearby`, `/locations/area`, evento global `locationUpdated`).
 *
 * Algoritmo: snap a grilla de 0.002° (~220 m) + offset de hasta ±0.001° por eje derivado de
 * HMAC-SHA256(secreto de servidor, `professionalId:díaUTC`).
 *  - Determinista por profesional y por día UTC: el pin no salta entre requests y repetir la
 *    consulta no permite promediar ruido para triangular.
 *  - El HMAC con secreto evita que quien conozca el id y el día pueda restar el offset.
 *  - Desplazamiento máximo respecto de la coordenada real: 0.002° por eje (~315 m en diagonal);
 *    el snap descarta la posición dentro de la celda.
 */
export const OBFUSCATION_GRID_DEG = 0.002;
export const OBFUSCATION_MAX_OFFSET_DEG = 0.001;
const COORD_DECIMALS = 5;

export function utcDayWindow(now: Date): number {
  return Math.floor(now.getTime() / 86_400_000);
}

export function obfuscateCoordinates(
  latitude: number,
  longitude: number,
  professionalId: number | string,
  secret: string,
  now: Date = new Date(),
): { latitude: number; longitude: number } {
  const digest = createHmac('sha256', secret)
    .update(`${professionalId}:${utcDayWindow(now)}`)
    .digest();
  // Dos enteros de 32 bits -> [-1, 1)
  const unitLat = digest.readUInt32BE(0) / 0xffffffff;
  const unitLng = digest.readUInt32BE(4) / 0xffffffff;
  const offLat = (unitLat * 2 - 1) * OBFUSCATION_MAX_OFFSET_DEG;
  const offLng = (unitLng * 2 - 1) * OBFUSCATION_MAX_OFFSET_DEG;

  const snappedLat =
    (Math.floor(latitude / OBFUSCATION_GRID_DEG) + 0.5) * OBFUSCATION_GRID_DEG;
  const snappedLng =
    (Math.floor(longitude / OBFUSCATION_GRID_DEG) + 0.5) * OBFUSCATION_GRID_DEG;

  const round = (v: number) => Number(v.toFixed(COORD_DECIMALS));
  return {
    latitude: round(snappedLat + offLat),
    longitude: round(snappedLng + offLng),
  };
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const rad = (d: number) => d * (Math.PI / 180);
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) *
      Math.cos(rad(lat2)) *
      Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
