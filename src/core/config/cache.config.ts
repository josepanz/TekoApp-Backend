// src/core/config/cache.config.ts
import {
  CacheModuleOptions,
  CacheModuleAsyncOptions,
} from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

export const getCacheModuleConfig = (
  configService: ConfigService,
): CacheModuleOptions => {
  // Consumimos directamente de los namespaces cargados nativamente
  const host = configService.get<string>('config.redis.host', 'localhost');
  const port = configService.get<number>('config.redis.port', 6379);
  const password = configService.get<string>('config.redis.password');
  const db = configService.get<number>('config.redis.db', 1); // DB 1 dedicada a Caché
  const ttl = configService.get<number>('config.cache.ttl', 300);
  const max = configService.get<number>('config.cache.maxItems', 1000);

  return {
    store: redisStore,
    host,
    port,
    password,
    db,
    ttl,
    max,
    retryDelayOnFailover: 100,
    enableOfflineQueue: false,
    lazyConnect: true,
    keyPrefix: 'tekoapp:',
  };
};

/**
 * Registro asíncrono global para inyectar en el AppModule central
 */
export const cacheModuleAsyncOptions: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [],
  useFactory: (configService: ConfigService) =>
    getCacheModuleConfig(configService),
  inject: [ConfigService],
};
