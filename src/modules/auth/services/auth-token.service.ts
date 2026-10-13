import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Users, UserStatus } from '@prisma/client';

import { PrismaDatasource } from '@core/database/services/prisma.service';
import { APP_CONFIG, AppConfigType } from '@core/config/config-loader';
import { CryptoHelper } from '@common/helpers/crypto-helpers';
import { PasswordExpirationHelper } from '@modules/auth/helpers';

import { TokenRevocationService } from './token-revocation.service';
import { t } from '@common/i18n/i18n.helper';
/**
 * Servicio especializado en gestión de tokens de autenticación JWT (stateless)
 */
@Injectable()
export class AuthTokenService {
  private readonly logger = new Logger(AuthTokenService.name);

  constructor(
    private readonly prisma: PrismaDatasource,
    @Inject(APP_CONFIG.KEY)
    private configService: ConfigType<AppConfigType>,
    private readonly tokenRevocation: TokenRevocationService,
  ) {
    CryptoHelper.initConfigService(configService);
  }

  /**
   * Genera access token y refresh token (stateless)
   */
  generateTokens(payload: { user: Users; rememberMe: boolean }): {
    accessToken: string;
    refreshToken: string;
  } {
    const refreshTokenExpiry = payload.rememberMe
      ? this.configService.authentication.refreshTokenExpires
      : this.configService.authentication.shortRefreshTokenExpires;

    const [accessToken, refreshToken] = [
      CryptoHelper.generateToken(
        'accessToken',
        {
          sub: payload.user.referenceId,
          email: payload.user.email,
          status: payload.user.status,
          isEmployee: payload.user.isEmployee,
          firstName: payload.user.firstName,
          lastName: payload.user.lastName,
          accessLevelId: payload.user.accessLevelId,
          userStatus: payload.user.status,
          profileStatus: payload.user.profileStatus,
        },
        'RS256',
        this.configService.authentication.accessTokenExpires,
      ),
      CryptoHelper.generateToken(
        'refreshToken',
        {
          sub: payload.user.referenceId,
          type: 'refresh',
          // DEF-BE-006: identificador único para poder revocarlo (denylist en Redis)
          jti: randomUUID(),
        },
        'RS256',
        refreshTokenExpiry,
      ),
    ];

    return { accessToken, refreshToken };
  }

  /**
   * Logout: revoca el refresh token (denylist de `jti` con TTL = vida restante). Idempotente:
   * revocar dos veces no es error. Un token legacy sin `jti` no se puede revocar (se registra
   * un warning y se responde igual: expira solo). Si Redis falla, el logout falla con 500
   * (fail-closed: no se debe aparentar una sesión cerrada que sigue viva).
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const payload = CryptoHelper.verifyRefreshToken(refreshToken);
    if (payload.tokenType !== 'refreshToken') {
      throw new UnauthorizedException(t('auth.INVALID_REFRESH_TOKEN'));
    }
    if (!payload.jti) {
      this.logger.warn(
        'Logout con refresh token legacy sin jti: no se puede revocar, expira por su cuenta.',
      );
      return;
    }
    const ttl = payload.exp - Math.floor(Date.now() / 1000);
    if (ttl <= 0) return;
    try {
      await this.tokenRevocation.revoke(payload.jti, ttl);
    } catch (error) {
      this.logger.error(
        `No se pudo revocar el refresh token: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new InternalServerErrorException(t('auth.LOGOUT_FAILED'));
    }
  }

  /**
   * Genera un nuevo access token desde un refresh token (stateless)
   * Valida: firma, expiración y estado del usuario
   */
  async generateAccessTokenFromRefresh(refreshToken: string): Promise<string> {
    // Verificar firma y expiración del refresh token
    const payload = CryptoHelper.verifyRefreshToken(refreshToken);

    // Validar que sea un refresh token
    if (payload.tokenType !== 'refreshToken') {
      throw new UnauthorizedException(t('auth.INVALID_REFRESH_TOKEN'));
    }

    // DEF-BE-006: refresh revocado por logout. Los tokens emitidos antes de este cambio no
    // tienen `jti` y se aceptan hasta que expiren (evita desloguear a todos en el deploy).
    if (payload.jti && (await this.tokenRevocation.isRevoked(payload.jti))) {
      throw new UnauthorizedException(t('auth.REFRESH_TOKEN_REVOKED'));
    }

    // Buscar usuario por referenceId (del payload)
    const user = await this.prisma.extended.users.findUnique({
      where: { referenceId: payload.sub },
      select: {
        id: true,
        referenceId: true,
        email: true,
        status: true,
        isEmployee: true,
        firstName: true,
        lastName: true,
      },
    });

    // Validar que el usuario existe y está activo
    if (!user) {
      throw new UnauthorizedException(t('auth.USER_DOES_NOT_EXIST'));
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(t('auth.USER_INACTIVE_CONTACT_SUPPORT'));
    }

    // Rechazar el refresh si la contraseña de la credencial activa expiró
    // (mismo criterio que el login).
    const activeCredential =
      await this.prisma.extended.userCredentials.findFirst({
        where: { userId: user.id, isActive: true },
        orderBy: { createdAt: 'desc' },
        select: { expiredAt: true },
      });

    PasswordExpirationHelper.assertNotExpired(activeCredential?.expiredAt);

    // Generar nuevo access token
    const newAccessToken = CryptoHelper.generateToken(
      'accessToken',
      {
        sub: user.referenceId,
        email: user.email,
        status: user.status,
        isEmployee: user.isEmployee,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      'RS256',
      this.configService.authentication.accessTokenExpires,
    );

    return newAccessToken;
  }
}
