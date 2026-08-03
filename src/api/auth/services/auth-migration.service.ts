import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { CryptoHelper } from '@common/helpers/crypto-helpers';

import { t } from '@common/i18n/i18n.helper';
@Injectable()
export class AuthMigrationService {
  private readonly logger = new Logger(AuthMigrationService.name);

  constructor() {}

  verifyTempToken(token: string, expectedEmail: string): void {
    try {
      const payload = CryptoHelper.verifyJwt<{
        sub: string;
        email: string;
        tokenType: string;
      }>(token);

      if (
        payload.tokenType !== 'tempToken' ||
        payload.email !== expectedEmail
      ) {
        throw new UnauthorizedException(t('auth.INVALID_OR_EXPIRED_TOKEN'));
      }
    } catch {
      throw new UnauthorizedException(t('auth.INVALID_OR_EXPIRED_TOKEN'));
    }
  }

  verifyForgotPasswordToken(token: string): string {
    try {
      const payload = CryptoHelper.verifyJwt<{
        sub: string;
        email: string;
        tokenType: string;
        action?: string;
      }>(token);

      if (
        payload.tokenType !== 'tempToken' ||
        payload.action !== 'forgotPassword'
      ) {
        throw new UnauthorizedException(t('auth.INVALID_OR_EXPIRED_TOKEN'));
      }

      return payload.email;
    } catch {
      throw new UnauthorizedException(t('auth.INVALID_OR_EXPIRED_TOKEN'));
    }
  }
}
