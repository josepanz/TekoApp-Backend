import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import {
  NONCE_KEY_PREFIX,
  NONCE_RANDOM_BYTES,
  NONCE_REDIS_CLIENT,
  NONCE_TTL_SECONDS,
} from '@modules/auth/constants';

/**
 * Servicio de nonces anti-replay para el login.
 *
 * - `issue()` genera un nonce aleatorio criptográficamente seguro y lo guarda en
 *   Redis con TTL corto.
 * - `consume()` lo valida y lo borra en una única operación atómica (`GETDEL`),
 *   garantizando uso único incluso ante requests concurrentes.
 */
@Injectable()
export class NonceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NonceService.name);

  constructor(@Inject(NONCE_REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * Conecta el cliente al arrancar el módulo en vez de esperar al primer
   * comando real. El provider usa `lazyConnect: true` + `enableOfflineQueue:
   * false` (falla rápido si Redis está caído en vez de acumular comandos en
   * una cola invisible) — pero esa combinación tiene una trampa: el PRIMER
   * comando después de un boot dispara el connect de forma asíncrona y, como
   * la cola offline está deshabilitada, ese mismo comando se rechaza de
   * inmediato con "Stream isn't writeable" antes de que el socket llegue a
   * abrirse (confirmado en pruebas manuales: el primer login tras un restart
   * siempre fallaba, el segundo intento ya funcionaba). Conectar acá elimina
   * la carrera sin volver a habilitar la cola offline.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.redis.connect();
    } catch (error) {
      this.logger.error(
        `No se pudo conectar el cliente Redis de nonces al iniciar: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Genera y persiste un nuevo nonce. Devuelve el valor (32 chars hex).
   */
  async issue(): Promise<string> {
    const nonce = crypto.randomBytes(NONCE_RANDOM_BYTES).toString('hex');
    await this.redis.set(
      `${NONCE_KEY_PREFIX}${nonce}`,
      '1',
      'EX',
      NONCE_TTL_SECONDS,
    );
    return nonce;
  }

  /**
   * Consume un nonce de forma atómica. Devuelve `true` solo si existía (nunca
   * usado y sin expirar); en ese caso queda borrado. `false` si no existía, ya
   * fue usado o expiró.
   */
  async consume(nonce: string): Promise<boolean> {
    if (!nonce || typeof nonce !== 'string') {
      return false;
    }
    // GETDEL: get + delete atómico (Redis >= 6.2). Elimina la ventana de carrera
    // de un get + del separado.
    const previous = await this.redis.getdel(`${NONCE_KEY_PREFIX}${nonce}`);
    return previous !== null;
  }

  onModuleDestroy(): void {
    try {
      this.redis.disconnect();
    } catch (error) {
      this.logger.warn(
        `Error al cerrar el cliente Redis de nonces: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
