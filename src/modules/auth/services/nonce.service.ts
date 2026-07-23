import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
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
export class NonceService implements OnModuleDestroy {
  private readonly logger = new Logger(NonceService.name);

  constructor(@Inject(NONCE_REDIS_CLIENT) private readonly redis: Redis) {}

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
