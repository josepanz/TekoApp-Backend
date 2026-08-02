import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { ApiClientCredential } from '@prisma/client';
import { CryptoHelper } from '@common/helpers/crypto-helpers';

import { t } from '@common/i18n/i18n.helper';
@Injectable()
export class BasicAuthGuard implements CanActivate {
  private readonly logger = new Logger(BasicAuthGuard.name);

  constructor(private readonly prisma: PrismaDatasource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<
        ExpressRequest & { apiClient?: { id: string; name: string } }
      >();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException(t('auth.BASIC_AUTH_REQUIRED'));
    }

    const encodedCredentials = authHeader.substring(6);
    let decodedString: string;

    try {
      decodedString = Buffer.from(encodedCredentials, 'base64').toString(
        'utf8',
      );
    } catch (error) {
      this.logger.error(
        `Error de decodificación Base64 en Basic Auth. ${error}`,
      );
      throw new UnauthorizedException(t('auth.INVALID_CREDENTIALS_FORMAT'));
    }

    const credentials = decodedString.split(':');
    if (credentials.length !== 2) {
      throw new UnauthorizedException(t('auth.INVALID_BASIC_AUTH_FORMAT'));
    }

    const [clientId, clientSecret] = credentials;

    let apiClientCredential: ApiClientCredential;
    try {
      apiClientCredential =
        await this.prisma.extended.apiClientCredential.findUnique({
          where: { clientId: clientId },
        });
    } catch (error) {
      this.logger.error(
        'Error de base de datos al buscar credenciales:',
        error instanceof Error ? error.stack : String(error),
      );
      throw new ForbiddenException(
        t('auth.CREDENTIALS_VALIDATION_SERVICE_ERROR'),
      );
    }

    if (!apiClientCredential) {
      throw new UnauthorizedException(t('auth.INVALID_CLIENT_ID'));
    }

    if (!apiClientCredential.isActive) {
      this.logger.warn(`Acceso denegado: Cliente ${clientId} inactivo.`);
      throw new ForbiddenException(t('auth.CLIENT_ACCESS_REVOKED'));
    }

    // El secreto se guarda hasheado (bcrypt); comparación segura, no `===`.
    const isPasswordValid = CryptoHelper.compareHashes(
      clientSecret,
      apiClientCredential.secretKey,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(t('auth.INVALID_CLIENT_SECRET'));
    }

    request.apiClient = {
      id: apiClientCredential.clientId,
      name: apiClientCredential.clientName,
    };

    return true;
  }
}
