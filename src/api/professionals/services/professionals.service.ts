import {
  Injectable,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, ProfessionalStatus, VerificationStatus } from '@prisma/client';
import { ProfessionalsDbService } from '@modules/professionals-db/services/professionals-db.service';
import { ReportService } from '@modules/report/services/report.service';
import { IDownloadResponse } from '@core/interceptors/file-download.interceptor';
import { PaginationQueryDTO } from '@common/dtos/pagination.dto';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { RatingViewerContext } from '@api/ratings/helpers/ratings-response.helper';
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
@Injectable()
export class ProfessionalsService {
  constructor(
    private readonly professionalsDb: ProfessionalsDbService,
    private readonly reportService: ReportService,
  ) {}

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
  ): Promise<ProfessionalsListResponseDTO> {
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
  ): Promise<ProfessionalDetailResponseDTO[]> {
    const result = await this.professionalsDb.findNearby(
      query.latitude,
      query.longitude,
      query.radius,
      query.categoryId,
    );
    return result as unknown as ProfessionalDetailResponseDTO[];
  }

  async getProfessionalById(
    id: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    const result = await this.professionalsDb.findById(id);
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
  ): Promise<ProfessionalDetailResponseDTO> {
    const result =
      await this.professionalsDb.findProfessionalByReferenceId(referenceId);
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
  ): Promise<ProfessionalServicesListResponseDTO> {
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
  ): Promise<ProfessionalStatsResponseDTO> {
    return this.professionalsDb.getStats(id);
  }

  async searchBySkills(
    query: SearchBySkillsQueryDTO,
  ): Promise<ProfessionalsListResponseDTO> {
    const skills = query.skills.split(',').map((s) => s.trim());
    const result = await this.professionalsDb.searchBySkills(
      skills,
      query as unknown as PaginationQueryDTO & Record<string, unknown>,
    );
    return result as unknown as ProfessionalsListResponseDTO;
  }

  async getTopRatedProfessionals(
    query: GetTopRatedQueryDTO,
  ): Promise<ProfessionalDetailResponseDTO[]> {
    const result = await this.professionalsDb.getTopRated(
      query.categoryId,
      query.limit,
    );
    return result as unknown as ProfessionalDetailResponseDTO[];
  }

  async verifyProfessional(
    id: number,
    dto: VerifyProfessionalRequestDTO,
    adminId: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    const professional = await this.professionalsDb.findById(id);
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
    const result = await this.professionalsDb.findById(id);
    return result as unknown as ProfessionalDetailResponseDTO;
  }

  async suspendProfessional(
    id: number,
    reason: string,
    adminId: number,
  ): Promise<ProfessionalDetailResponseDTO> {
    const professional = await this.professionalsDb.findById(id);
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
    const result = await this.professionalsDb.findById(id);
    return result as unknown as ProfessionalDetailResponseDTO;
  }
}
