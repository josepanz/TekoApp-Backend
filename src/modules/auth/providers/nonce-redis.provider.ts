import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigType } from '@nestjs/config';
import { APP_CONFIG, AppConfigType } from '@core/config/config-loader';
import { NONCE_REDIS_CLIENT } from '@modules/auth/constants';

/**
 * Cliente Redis dedicado al almacenamiento de nonces del login.
 *
 * Se usa `ioredis` directamente (ya es dependencia del proyecto) en lugar de
 * `cache-manager`, porque la versión instalada de `cache-manager` (v7, basada en
 * Keyv) es incompatible con `cache-manager-redis-store` v3 configurado en
 * `cache.config.ts`, y además el `CacheModule` nunca llegó a registrarse en el
 * `AppModule`. `ioredis` además expone `GETDEL`, que permite consumir el nonce
 * de forma atómica (get + delete en una sola operación), eliminando la ventana
 * de carrera que tendría un `get` + `del` separado.
 *
 * Namespace de claves: prefijo `tekoapp:` (igual que el store de cache) + la
 * clave `nonce:<valor>` que arma el `NonceService`.
 */
export const nonceRedisProvider: Provider = {
  provide: NONCE_REDIS_CLIENT,
  inject: [APP_CONFIG.KEY],
  useFactory: (config: ConfigType<AppConfigType>): Redis => {
    return new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      keyPrefix: 'tekoapp:',
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
    });
  },
};
