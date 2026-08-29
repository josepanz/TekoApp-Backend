import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { LegalDocumentType, ServiceStatus } from '@prisma/client';
import { APP_CONFIG, AppConfigType } from '@core/config/config-loader';
import { ServiceProgressDbService } from '@modules/service-progress-db/services/service-progress-db.service';
import { ServicesDbService } from '@modules/services-db/services/services-db.service';
import { LegalConsentsDbService } from '@modules/legal-consents-db/services/legal-consents-db.service';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { t } from '@common/i18n/i18n.helper';
import { CreateServiceProgressEntryRequestDTO } from '../dtos/request';
import { ServiceProgressEntryResponseDTO } from '../dtos/response';
import {
  mapEntriesToResponse,
  mapEntryToResponse,
} from '../helpers/service-progress-response.helper';

const IN_PROGRESS_STATUSES = new Set<ServiceStatus>([
  ServiceStatus.ACCEPTED,
  ServiceStatus.IN_PROGRESS,
]);

@Injectable()
export class ServiceProgressService {
  constructor(
    private readonly db: ServiceProgressDbService,
    private readonly servicesDb: ServicesDbService,
    private readonly legalConsentsDb: LegalConsentsDbService,
    @Inject(APP_CONFIG.KEY)
    private readonly configService: ConfigType<AppConfigType>,
  ) {}

  async createEntry(
    serviceReferenceId: string,
    dto: CreateServiceProgressEntryRequestDTO,
    userId: number,
    createdBy: string,
  ): Promise<ServiceProgressEntryResponseDTO> {
    const service =
      await this.servicesDb.findServiceByReferenceId(serviceReferenceId);
    if (!service)
      throw new NotFoundException(t('service-progress.SERVICE_NOT_FOUND'));

    const professional = await this.servicesDb.findProfessionalByUserId(userId);
    if (!professional || service.professionalId !== professional.id) {
      throw new ForbiddenException(
        t('service-progress.ONLY_ASSIGNED_PROFESSIONAL_CAN_ADD'),
      );
    }
    if (!IN_PROGRESS_STATUSES.has(service.status)) {
      throw new ConflictException(
        t('service-progress.SERVICE_NOT_IN_PROGRESS'),
      );
    }

    const { requireNoteOrImage, maxImagesPerEntry, editWindowMinutes } =
      this.configService.progressLog;
    const images = dto.images ?? [];
    if (requireNoteOrImage && !dto.note && images.length === 0) {
      throw new BadRequestException(
        t('service-progress.NOTE_OR_IMAGE_REQUIRED'),
      );
    }
    if (images.length > maxImagesPerEntry) {
      throw new BadRequestException(t('service-progress.TOO_MANY_IMAGES'));
    }

    // Consentimiento de uso de imagen — solo se exige cuando la entrada realmente incluye fotos
    // (una entrada solo-texto no debería bloquearse por esto). Mismo chequeo que hace
    // RequiresActiveConsentGuard, aplicado acá inline en vez de como guard porque depende del
    // contenido del body, no solo de la ruta — ver openspec/specs/data-and-media-consent.md.
    if (images.length > 0) {
      const hasImageConsent = await this.legalConsentsDb.hasActiveConsent(
        userId,
        LegalDocumentType.IMAGE_USAGE_CONSENT,
      );
      if (!hasImageConsent) {
        throw new ForbiddenException({
          message: t('legal-consents.CONSENT_REQUIRED'),
          errorCode: 'CONSENT_REQUIRED',
        });
      }
    }

    const entryOrder = await this.db.getNextEntryOrder(service.id);
    const entry = await this.db.createEntry({
      serviceId: service.id,
      professionalId: professional.id,
      note: dto.note,
      images,
      entryOrder,
      createdBy,
    });
    return mapEntryToResponse(entry, editWindowMinutes);
  }

  async listByService(
    serviceReferenceId: string,
    user: IUserDataOnJwt,
  ): Promise<{ data: ServiceProgressEntryResponseDTO[] }> {
    const service =
      await this.servicesDb.findServiceByReferenceId(serviceReferenceId);
    if (!service)
      throw new NotFoundException(t('service-progress.SERVICE_NOT_FOUND'));

    const professional = await this.servicesDb.findProfessionalByUserId(
      user.id,
    );
    const isParticipant =
      service.userId === user.id ||
      (professional !== null && service.professionalId === professional.id);
    const isStaff = (user.permissions ?? []).some(
      (permission) =>
        permission === PERMISSIONS.SERVICE_PROGRESS.AUDIT_VIEW ||
        permission === PERMISSIONS.ADMIN.ALL,
    );
    if (!isParticipant && !isStaff) {
      throw new ForbiddenException(
        t('service-progress.NOT_AUTHORIZED_TO_VIEW'),
      );
    }

    const entries = await this.db.findActiveByServiceId(service.id);
    return {
      data: mapEntriesToResponse(
        entries,
        this.configService.progressLog.editWindowMinutes,
      ),
    };
  }

  async deleteEntry(
    entryReferenceId: string,
    userId: number,
    changedBy: string,
  ): Promise<void> {
    const entry = await this.db.findEntryByReferenceId(entryReferenceId);
    if (!entry || !entry.isActive) {
      throw new NotFoundException(t('service-progress.ENTRY_NOT_FOUND'));
    }

    const professional = await this.servicesDb.findProfessionalByUserId(userId);
    if (!professional || entry.professionalId !== professional.id) {
      throw new ForbiddenException(t('service-progress.NOT_ENTRY_AUTHOR'));
    }

    const { editWindowMinutes } = this.configService.progressLog;
    const windowExpiresAt = new Date(
      entry.createdAt.getTime() + editWindowMinutes * 60_000,
    );
    if (new Date() > windowExpiresAt) {
      throw new ConflictException(t('service-progress.EDIT_WINDOW_EXPIRED'));
    }

    await this.db.softDeleteEntry(entry.id, changedBy);
  }
}
