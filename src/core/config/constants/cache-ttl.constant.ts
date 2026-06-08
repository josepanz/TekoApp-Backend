// src/core/config/constants/cache-ttl.constant.ts

export const CACHE_TTL_CONFIG = {
  user: 3600, // 1 hora
  professional: 1800, // 30 minutos
  service: 900, // 15 minutos
  category: 7200, // 2 horas
  location: 300, // 5 minutos
  rating: 1800, // 30 minutos
  payment: 600, // 10 minutos
  notification: 1800, // 30 minutos
  search: 300, // 5 minutos
  analytics: 3600, // 1 hora
} as const;

export type CacheTypeKey = keyof typeof CACHE_TTL_CONFIG;

/**
 * Obtiene el TTL por defecto para un tipo de entidad específico
 */
export function getCacheTTL(type: CacheTypeKey | string): number {
  return CACHE_TTL_CONFIG[type as CacheTypeKey] ?? 300; // 5 minutos default
}
