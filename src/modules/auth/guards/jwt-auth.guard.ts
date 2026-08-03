import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';
import { t } from '@common/i18n/i18n.helper';
import { UserWithSecurities } from '../types/user.types';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = UserWithSecurities>(
    err: unknown,
    user: unknown,
    info: unknown,
  ): TUser {
    // Token expirado
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: t('auth.ACCESS_TOKEN_EXPIRED'),
        error: 'Unauthorized',
        code: 'TOKEN_EXPIRED',
      });
    }

    // Token inválido / usuario inexistente
    if (err || !user) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: t('auth.INVALID_ACCESS_TOKEN'),
        error: 'Unauthorized',
        code: 'INVALID_TOKEN',
      });
    }

    return user as TUser;
  }
}
