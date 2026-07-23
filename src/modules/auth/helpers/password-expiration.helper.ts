import { UnauthorizedException } from '@nestjs/common';
import {
  MILLISECONDS_PER_DAY,
  PASSWORD_EXPIRED_CODE,
  PASSWORD_EXPIRED_MESSAGE,
} from '@modules/auth/constants';

/**
 * Helper de expiración de contraseña.
 *
 * La expiración es indefinida por defecto (`expiredAt === null`). Solo cuando la
 * credencial activa tiene una fecha `expiredAt` en el pasado se considera
 * expirada. Se usa tanto en el login como en el refresh de token.
 */
export class PasswordExpirationHelper {
  /**
   * `true` si `expiredAt` tiene valor y ya pasó. `null`/`undefined` => no expira.
   */
  static isExpired(expiredAt: Date | null | undefined): boolean {
    return !!expiredAt && expiredAt.getTime() <= Date.now();
  }

  /**
   * Lanza `UnauthorizedException` con código `PASSWORD_EXPIRED` si expiró.
   */
  static assertNotExpired(expiredAt: Date | null | undefined): void {
    if (this.isExpired(expiredAt)) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: PASSWORD_EXPIRED_MESSAGE,
        error: 'Unauthorized',
        code: PASSWORD_EXPIRED_CODE,
      });
    }
  }

  /**
   * Calcula la fecha de expiración a partir de la cantidad de días configurada.
   * `days <= 0` o `null`/`undefined` => `null` (expiración indefinida, default del
   * proyecto). Aritmética interna del servidor (no parsea input de usuario), por eso
   * usa `Date` directo — no aplica la prohibición de `new Date("string")`.
   */
  static computeExpiresAt(days: number | null | undefined): Date | null {
    if (!days || days <= 0) {
      return null;
    }
    return new Date(Date.now() + days * MILLISECONDS_PER_DAY);
  }
}
