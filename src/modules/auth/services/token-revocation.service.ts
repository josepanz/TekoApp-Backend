import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

import { NONCE_REDIS_CLIENT } from '@modules/auth/constants';

/** Prefijo (dentro del namespace `tekoapp:` del cliente) de la denylist de refresh tokens. */
export const REVOKED_JTI_KEY_PREFIX = 'revoked:jti:';

/**
 * Denylist de refresh tokens por `jti` (DEF-BE-006). Los JWT son stateless, así que el logout
 * guarda el `jti` en Redis con TTL = tiempo restante del token (la clave desaparece sola cuando
 * el token ya habría expirado). Reusa el cliente Redis de nonces (mismo namespace `tekoapp:`,
 * ya conectado por `NonceService`).
 */
@Injectable()
export class TokenRevocationService {
  private readonly logger = new Logger(TokenRevocationService.name);

  constructor(@Inject(NONCE_REDIS_CLIENT) private readonly redis: Redis) {}

  /** Revoca el `jti`. Propaga el error si Redis falla (el logout es fail-closed). */
  async revoke(jti: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(
      `${REVOKED_JTI_KEY_PREFIX}${jti}`,
      '1',
      'EX',
      Math.max(1, Math.ceil(ttlSeconds)),
    );
  }

  /**
   * `true` si el `jti` está revocado. Si Redis no responde NO se bloquea el refresh (fail-open,
   * menor sorpresa: Redis ya es dependencia del rate-limit y una caída no debe desloguear a
   * todos); se deja un warning.
   */
  async isRevoked(jti: string): Promise<boolean> {
    try {
      return (await this.redis.exists(`${REVOKED_JTI_KEY_PREFIX}${jti}`)) === 1;
    } catch (error) {
      this.logger.warn(
        `Redis no disponible al consultar la denylist de refresh tokens; se permite el refresh: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }
}
