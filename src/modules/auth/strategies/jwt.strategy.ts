import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersDBService } from '@modules/users-db/services/users-db.service';
import { APP_CONFIG, AppConfigType } from '@core/config/config-loader';
import { ConfigType } from '@nestjs/config';
import { IJwtPayload } from '@api/auth/interfaces';
import { UserWithSecuritiesExtended } from '../types/user.types';
import { IUserDataOnJwt } from '../interfaces/user-data-on-jwt.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly usersService: UsersDBService,
    @Inject(APP_CONFIG.KEY)
    private readonly configService: ConfigType<AppConfigType>,
  ) {
    super({
      // EventSource (SSE) no puede mandar el header Authorization — se agrega el fallback de
      // query param `access_token` solo para eso (mismo patrón estándar de passport-jwt para SSE
      // y websockets). El header Bearer sigue siendo la vía normal para el resto de la API.
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('access_token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.authentication.publicKey,
    });
  }

  async validate(payload: IJwtPayload): Promise<IUserDataOnJwt> {
    const user: UserWithSecuritiesExtended | null =
      await this.usersService.findActiveUserByEmailWithPermissions(
        payload.email,
      );

    if (!user) {
      throw new UnauthorizedException();
    }

    const directPermissions = user.permissions
      .map((p) => p.permission?.name)
      .filter(Boolean);

    const rolePermissions = user.roles
      .flatMap(
        (ur) =>
          ur.role?.rolePermissions?.map((rp) => rp.permission?.name) || [],
      )
      .filter(Boolean);

    const permissions = [
      ...new Set([...directPermissions, ...rolePermissions]),
    ];

    return {
      id: user.id,
      referenceId: user.referenceId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      accessLevelId: user.accessLevelId,
      userStatus: user.status,
      profileStatus: user.profileStatus,
      permissions: permissions,
      roles: user.roles.map((ur) => ur.role?.name).filter(Boolean),
    };
  }
}
