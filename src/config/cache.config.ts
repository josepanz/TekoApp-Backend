import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

export class CacheConfig {
  static createCacheModule(configService: ConfigService) {
    return CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_DB', 1), // Usar DB 1 para cache
        ttl: configService.get('CACHE_TTL', 300), // 5 minutos por defecto
        max: configService.get('CACHE_MAX_ITEMS', 1000),
        retryDelayOnFailover: 100,
        enableOfflineQueue: false,
        lazyConnect: true,
        keyPrefix: 'tekoapp:',
      }),
      inject: [ConfigService],
    });
  }

  // Configuración de TTL para diferentes tipos de datos
  static getTTL(type: string): number {
    const ttlConfig = {
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
    };

    return ttlConfig[type] || 300;
  }

  // Claves de cache para diferentes entidades
  static getCacheKey(type: string, identifier: string | number): string {
    return `${type}:${identifier}`;
  }

  // Claves de cache para listas
  static getListCacheKey(type: string, filters: Record<string, any>): string {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    return `${type}:list:${filterString}`;
  }

  // Claves de cache para búsquedas
  static getSearchCacheKey(query: string, filters: Record<string, any>): string {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    return `search:${query}:${filterString}`;
  }

  // Claves de cache para geolocalización
  static getLocationCacheKey(latitude: number, longitude: number, radius: number): string {
    // Redondear coordenadas para agrupar ubicaciones cercanas
    const lat = Math.round(latitude * 1000) / 1000;
    const lng = Math.round(longitude * 1000) / 1000;
    const rad = Math.round(radius * 100) / 100;
    
    return `location:${lat}:${lng}:${rad}`;
  }

  // Claves de cache para estadísticas
  static getStatsCacheKey(type: string, period: string, filters: Record<string, any>): string {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    return `stats:${type}:${period}:${filterString}`;
  }
}
