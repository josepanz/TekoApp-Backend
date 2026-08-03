import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';
import { UserCredentialsWithUser } from '@modules/auth/types';

import { t } from '@common/i18n/i18n.helper';
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(
    email: string,
    password: string,
  ): Promise<UserCredentialsWithUser> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException(t('auth.INVALID_CREDENTIALS'));
    }

    return user;
  }
}
