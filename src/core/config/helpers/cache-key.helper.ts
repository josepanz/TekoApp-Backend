// src/core/config/helpers/cache-key.helper.ts

/**
 * Genera strings unificados para almacenamiento en Redis
 */
export class CacheKeyHelper {
  static getCacheKey(type: string, identifier: string | number): string {
    return `${type}:${identifier}`;
  }

  static getListCacheKey(
    type: string,
    filters: Record<string, unknown>,
  ): string {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    return `${type}:list:${filterString}`;
  }

  static getSearchCacheKey(
    query: string,
    filters: Record<string, unknown>,
  ): string {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    return `search:${query}:${filterString}`;
  }

  static getLocationCacheKey(
    latitude: number,
    longitude: number,
    radius: number,
  ): string {
    // Redondear coordenadas para agrupar ubicaciones cercanas de forma precisa
    const lat = Math.round(latitude * 1000) / 1000;
    const lng = Math.round(longitude * 1000) / 1000;
    const rad = Math.round(radius * 100) / 100;

    return `location:${lat}:${lng}:${rad}`;
  }

  static getStatsCacheKey(
    type: string,
    period: string,
    filters: Record<string, unknown>,
  ): string {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    return `stats:${type}:${period}:${filterString}`;
  }
}
