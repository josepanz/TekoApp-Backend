import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LegalDocumentType } from '@prisma/client';
import { REQUIRES_ACTIVE_CONSENT_KEY } from '@common/decorators/requires-active-consent.decorator';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { LegalConsentsDbService } from '@modules/legal-consents-db/services/legal-consents-db.service';
import { t } from '@common/i18n/i18n.helper';

/**
 * Bloquea un endpoint de subida (`@RequiresActiveConsent(LegalDocumentType.X)`) con
 * `403 CONSENT_REQUIRED` si el usuario no tiene un `UserConsents` vigente para ese
 * `LegalDocumentType` — ver `openspec/specs/data-and-media-consent.md`. Se aplica DESPUÉS de
 * `JwtAuthGuard` (necesita `request.user` ya resuelto).
 */
@Injectable()
export class RequiresActiveConsentGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly legalConsentsDb: LegalConsentsDbService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const documentType = this.reflector.getAllAndOverride<LegalDocumentType>(
      REQUIRES_ACTIVE_CONSENT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!documentType) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user: IUserDataOnJwt }>();

    const hasConsent = await this.legalConsentsDb.hasActiveConsent(
      user.id,
      documentType,
    );

    if (!hasConsent) {
      // `errorCode` — identificador estable para que el cliente (Mobile/Web) distinga este 403
      // puntual de cualquier otro 403 (ej. permisos) y dispare el flujo de aceptación en vez de un
      // error genérico. Ver `HttpExceptionFilter`.
      throw new ForbiddenException({
        message: t('legal-consents.CONSENT_REQUIRED'),
        errorCode: 'CONSENT_REQUIRED',
      });
    }

    return true;
  }
}
