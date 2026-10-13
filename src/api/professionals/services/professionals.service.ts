import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProfessionalStatus, VerificationStatus } from '@prisma/client';
import { ProfessionalsDbService } from '@modules/professionals-db/services/professionals-db.service';
import { ReportService } from '@modules/report/services/report.service';
import { IDownloadResponse } from '@core/interceptors/file-download.interceptor';
import { PaginationQueryDTO } from '@common/dtos/pagination.dto';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { RatingViewerContext } from '@api/ratings/helpers/ratings-response.helper';
import { NotificationsService } from '@api/notifications/services/notifications.service';
import { NotificationType } from '@modules/notifications-db/enums/notification-type.enum';
import { mapReviewsToSummaries } from '../helpers/professional-reviews-response.helper';
import {
  PROFESSIONALS_EXPORT_COLUMNS,
  mapProfessionalsToExportRows,
} from '../helpers/professionals-export.helper';
import {
  GetProfessionalsListQueryDTO,
  GetNearbyProfessionalsQueryDTO,
  GetTopRatedQueryDTO,
  SearchBySkillsQueryDTO,
  GetProfessionalServicesQueryDTO,
  GetProfessionalReviewsQueryDTO,
  CreateProfessionalRequestDTO,
  UpdateProfessionalRequestDTO,
  UpdateProfessionalLocationRequestDTO,
  VerifyProfessionalRequestDTO,
} from '../dtos/request';
import {
  ProfessionalDetailResponseDTO,
  ProfessionalsListResponseDTO,
  ProfessionalServicesListResponseDTO,
  ProfessionalReviewsListResponseDTO,
  ProfessionalStatsResponseDTO,
} from '../dtos/response';

import { t } from '@common/i18n/i18n.helper';
/** Estados desde los que `verify` es una transición válida (DEF-BE-028). */
const VERIFIABLE_STATUSES: ProfessionalStatus[] = [
  ProfessionalStatus.PENDING,
  ProfessionalStatus.REJECTED,
];

@Injectable()
export class ProfessionalsService {
  constructor(
    private readonly professionalsDb: ProfessionalsDbService,
    private readonly reportService: ReportService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Admin y quien gestiona profesionales (verify/suspend) ven profesionales en cualquier estado. */
  private canSeeAllProfessionals(viewer: IUserDataOnJwt): boolean {
    return (
      viewer.permissions?.some(
        (p) =>
          p === PERMISSIONS.ADMIN.ALL || p === PERMISSIONS.PROFESSIONALS.VERIFY,
      ) ?? false
    );
  }

  /**
   * Vista pública/cliente (DEF-BE-023): un profesional que no está APPROVED y activo solo lo ven un
   * admin, un gestor de profesionales o él mismo; para el resto responde 404 como si no existiera.
   */
  private assertProfessionalVisible(
    professional: {
      userId: number;
      status: ProfessionalStatus;
      isActive: boolean;
    },
    viewer: IUserDataOnJwt,
  ): void {
    if (
      this.canSeeAllProfessionals(viewer) ||
      professional.userId === viewer.id
    ) {
      return;
    }
    if (
      professional.status !== ProfessionalStatus.APPROVED ||
      !professional.isActive
    ) {
      throw new NotFoundException(t('professionals.NOT_FOUND'));
    }
  }

  async registerProfessional(
    dto: CreateProfessionalRequestDTO,
    userId: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    const result = await this.professionalsDb.create(
      dto as unknown as Prisma.ProfessionalsUncheckedCreateInput,
      userId,
    );
    return result as unknown as ProfessionalDetailResponseDTO;
  }

  async getProfessionals(
    query: GetProfessionalsListQueryDTO,
    viewer: IUserDataOnJwt,
  ): Promise<ProfessionalsListResponseDTO> {
    const filters = {
      onlyApproved: !this.canSeeAllProfessionals(viewer),
      categoryId: query.categoryId,
      latitude: query.latitude,
      longitude: query.longitude,
      radius: query.radius,
      minRating: query.minRating,
      maxPrice: query.maxPrice,
      isAvailable: query.isAvailable,
      search: query.search,
    };
    const result = await this.professionalsDb.findMany(
      filters,
      query as unknown as PaginationQueryDTO & Record<string, unknown>,
    );
    return result as unknown as ProfessionalsListResponseDTO;
  }

  // Mismos filtros que getProfessionals, sin paginar — el volumen lo controla el filtro, no
  // una página.
  async exportToCsv(
    query: GetProfessionalsListQueryDTO,
  ): Promise<IDownloadResponse> {
    const filters = {
      categoryId: query.categoryId,
      latitude: query.latitude,
      longitude: query.longitude,
      radius: query.radius,
      minRating: query.minRating,
      maxPrice: query.maxPrice,
      isAvailable: query.isAvailable,
      search: query.search,
    };
    const professionals = await this.professionalsDb.findAllForExport(filters);
    const buffer = await this.reportService.generate(
      {
        metadata: {
          title: 'Profesionales',
          excelColumns: PROFESSIONALS_EXPORT_COLUMNS,
        },
        items: mapProfessionalsToExportRows(professionals),
      },
      { format: 'csv' },
    );
    return {
      buffer,
      filename: `profesionales-${new Date().toISOString().slice(0, 10)}.csv`,
      format: 'csv',
    };
  }

  async getNearbyProfessionals(
    query: GetNearbyProfessionalsQueryDTO,
    viewer: IUserDataOnJwt,
  ): Promise<ProfessionalDetailResponseDTO[]> {
    const result = await this.professionalsDb.findNearby(
      query.latitude,
      query.longitude,
      query.radius,
      query.categoryId,
      !this.canSeeAllProfessionals(viewer),
    );
    return result as unknown as ProfessionalDetailResponseDTO[];
  }

  async getProfessionalById(
    id: number,
    viewer: IUserDataOnJwt,
  ): Promise<ProfessionalDetailResponseDTO> {
    const result = await this.professionalsDb.findById(id);
    this.assertProfessionalVisible(result, viewer);
    return result as unknown as ProfessionalDetailResponseDTO;
  }

  async getMyProfessionalProfile(
    userId: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    const result = await this.professionalsDb.findByUserId(userId);
    return result as unknown as ProfessionalDetailResponseDTO;
  }

  async getProfessionalByReference(
    referenceId: string,
    viewer: IUserDataOnJwt,
  ): Promise<ProfessionalDetailResponseDTO> {
    const result =
      await this.professionalsDb.findProfessionalByReferenceId(referenceId);
    this.assertProfessionalVisible(result, viewer);
    return result as unknown as ProfessionalDetailResponseDTO;
  }

  async updateProfessional(
    id: number,
    dto: UpdateProfessionalRequestDTO,
    userId: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    const professional = await this.professionalsDb.findById(id);
    if (professional.userId !== userId) {
      throw new ForbiddenException(t('professionals.UNAUTHORIZED_UPDATE'));
    }
    const result = await this.professionalsDb.update(id, dto);
    return result as unknown as ProfessionalDetailResponseDTO;
  }

  async updateProfessionalByReference(
    referenceId: string,
    dto: UpdateProfessionalRequestDTO,
    userId: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    const professional =
      await this.professionalsDb.findProfessionalByReferenceId(referenceId);
    if (professional.userId !== userId) {
      throw new ForbiddenException(t('professionals.UNAUTHORIZED_UPDATE'));
    }
    const result = await this.professionalsDb.update(professional.id, dto);
    return result as unknown as ProfessionalDetailResponseDTO;
  }

  async updateAvailability(
    id: number,
    isAvailable: boolean,
    userId: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    const professional = await this.professionalsDb.findById(id);
    if (professional.userId !== userId) {
      throw new ForbiddenException(t('professionals.UNAUTHORIZED_UPDATE'));
    }
    const result = await this.professionalsDb.update(id, { isAvailable });
    return result as unknown as ProfessionalDetailResponseDTO;
  }

  async updateLocation(
    id: number,
    dto: UpdateProfessionalLocationRequestDTO,
    userId: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    const professional = await this.professionalsDb.findById(id);
    if (professional.userId !== userId) {
      throw new ForbiddenException(t('professionals.UNAUTHORIZED_UPDATE'));
    }
    const result = await this.professionalsDb.update(id, {
      currentLatitude: dto.latitude,
      currentLongitude: dto.longitude,
      lastLocationUpdate: new Date(),
    });
    return result as unknown as ProfessionalDetailResponseDTO;
  }

  async getProfessionalServices(
    id: number,
    query: GetProfessionalServicesQueryDTO,
    viewer: IUserDataOnJwt,
  ): Promise<ProfessionalServicesListResponseDTO> {
    this.assertProfessionalVisible(
      await this.professionalsDb.findById(id),
      viewer,
    );
    const result = await this.professionalsDb.findServices(
      id,
      query as unknown as PaginationQueryDTO & Record<string, unknown>,
      query.status,
    );
    return result as unknown as ProfessionalServicesListResponseDTO;
  }

  /** Ver `mapReviewsToSummaries` — nunca exponer la fila cruda de `Users`/ignorar `isAnonymous`. */
  private async buildReviewViewerContext(
    user: IUserDataOnJwt,
  ): Promise<RatingViewerContext> {
    const isPrivileged =
      user.permissions.includes(PERMISSIONS.RATINGS.AUDIT_VIEW) ||
      user.permissions.includes(PERMISSIONS.ADMIN.ALL);
    const professionalId =
      await this.professionalsDb.findProfessionalIdByUserId(user.id);
    return { userId: user.id, professionalId, isPrivileged };
  }

  async getProfessionalReviews(
    id: number,
    query: GetProfessionalReviewsQueryDTO,
    user: IUserDataOnJwt,
  ): Promise<ProfessionalReviewsListResponseDTO> {
    this.assertProfessionalVisible(
      await this.professionalsDb.findById(id),
      user,
    );
    const [result, viewer] = await Promise.all([
      this.professionalsDb.findReviews(
        id,
        query as unknown as PaginationQueryDTO & Record<string, unknown>,
      ),
      this.buildReviewViewerContext(user),
    ]);
    return {
      data: mapReviewsToSummaries(result.data, viewer),
      pagination: result.pagination,
    };
  }

  async getProfessionalStats(
    id: number,
    viewer: IUserDataOnJwt,
  ): Promise<ProfessionalStatsResponseDTO> {
    this.assertProfessionalVisible(
      await this.professionalsDb.findById(id),
      viewer,
    );
    return this.professionalsDb.getStats(id);
  }

  async searchBySkills(
    query: SearchBySkillsQueryDTO,
    viewer: IUserDataOnJwt,
  ): Promise<ProfessionalsListResponseDTO> {
    const skills = query.skills.split(',').map((s) => s.trim());
    const result = await this.professionalsDb.searchBySkills(
      skills,
      query as unknown as PaginationQueryDTO & Record<string, unknown>,
      !this.canSeeAllProfessionals(viewer),
    );
    return result as unknown as ProfessionalsListResponseDTO;
  }

  async getTopRatedProfessionals(
    query: GetTopRatedQueryDTO,
    viewer: IUserDataOnJwt,
  ): Promise<ProfessionalDetailResponseDTO[]> {
    const result = await this.professionalsDb.getTopRated(
      query.categoryId,
      query.limit,
      !this.canSeeAllProfessionals(viewer),
    );
    return result as unknown as ProfessionalDetailResponseDTO[];
  }

  async verifyProfessional(
    id: number,
    dto: VerifyProfessionalRequestDTO,
    adminId: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    const professional = await this.professionalsDb.findById(id);
    // Máquina de estados (DEF-BE-028): solo se resuelve una verificación PENDING o se revisa una
    // REJECTED. APPROVED (ya resuelto) y SUSPENDED (no hay endpoint de reactivación: verify no
    // es la vía) son transiciones inválidas.
    if (!VERIFIABLE_STATUSES.includes(professional.status)) {
      throw new ConflictException(t('professionals.INVALID_STATE_FOR_VERIFY'));
    }
    // updateMany + count en vez de update() incondicional: evita que dos escrituras
    // administrativas concurrentes sobre el mismo profesional (ej. dos admins resolviendo la
    // misma verificación) se pisen sin detectar el conflicto — mismo patrón que
    // services/payments/professional-documents — ver .claude/rules/typescript.md.
    const updatedCount = await this.professionalsDb.updateConditional(
      id,
      [professional.status],
      {
        verificationStatus: dto.isVerified
          ? VerificationStatus.VERIFIED
          : VerificationStatus.REJECTED,
        status: dto.isVerified
          ? ProfessionalStatus.APPROVED
          : ProfessionalStatus.REJECTED,
        lastChangedBy: String(adminId),
        changedReason: dto.notes,
      },
    );
    if (updatedCount === 0) {
      throw new ConflictException(
        t('professionals.STATUS_CHANGED_BEFORE_VERIFY'),
      );
    }

    // I-05 (#33, IMPRESCINDIBLE): caso más literal del hallazgo — sin este aviso el profesional
    // no sabe que ya puede (o no puede) operar. El gate acá es que el `await` de arriba haya
    // resuelto sin lanzar (no hay `count` de negocio adicional que chequear).
    await this.notificationsService.create(
      {
        title: t(
          dto.isVerified
            ? 'professionals.NOTIFICATION_VERIFIED_TITLE'
            : 'professionals.NOTIFICATION_VERIFICATION_REJECTED_TITLE',
        ),
        message: t(
          dto.isVerified
            ? 'professionals.NOTIFICATION_VERIFIED_MESSAGE'
            : 'professionals.NOTIFICATION_VERIFICATION_REJECTED_MESSAGE',
        ),
        type: dto.isVerified
          ? NotificationType.PROFESSIONAL_VERIFIED
          : NotificationType.PROFESSIONAL_VERIFICATION_REJECTED,
        channels: ['in_app', 'push'],
      },
      professional.userId,
    );

    const result = await this.professionalsDb.findById(id);
    return result as unknown as ProfessionalDetailResponseDTO;
  }

  async suspendProfessional(
    id: number,
    reason: string,
    adminId: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    const professional = await this.professionalsDb.findById(id);
    // Máquina de estados (DEF-BE-029): solo se suspende un APPROVED. Re-suspender pisaría el
    // motivo y reenviaría la notificación; PENDING/REJECTED se resuelven con verify.
    if (professional.status !== ProfessionalStatus.APPROVED) {
      throw new ConflictException(t('professionals.INVALID_STATE_FOR_SUSPEND'));
    }
    const updatedCount = await this.professionalsDb.updateConditional(
      id,
      [professional.status],
      {
        status: ProfessionalStatus.SUSPENDED,
        isActive: false,
        lastChangedBy: String(adminId),
        changedReason: reason,
      },
    );
    if (updatedCount === 0) {
      throw new ConflictException(
        t('professionals.STATUS_CHANGED_BEFORE_SUSPEND'),
      );
    }

    // I-05 (#34, IMPRESCINDIBLE): necesita saber por qué dejó de poder operar, para poder
    // responder o apelar.
    await this.notificationsService.create(
      {
        title: t('professionals.NOTIFICATION_SUSPENDED_TITLE'),
        message: t('professionals.NOTIFICATION_SUSPENDED_MESSAGE', { reason }),
        type: NotificationType.PROFESSIONAL_SUSPENDED,
        channels: ['in_app', 'push'],
      },
      professional.userId,
    );

    const result = await this.professionalsDb.findById(id);
    return result as unknown as ProfessionalDetailResponseDTO;
  }
}
