import { Injectable } from '@nestjs/common';
import {
  AiDisclosureEntityType,
  ContentConsentGrants,
  ContentUsageScope,
  DataRetentionPolicies,
  LegalDocumentType,
  LegalDocumentVersions,
  Prisma,
  UserConsents,
  Users,
} from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PrismaPaginationUtil } from '@common/utils/prisma-pagination.util';
import {
  PaginationQueryDTO,
  PaginationResponseDTO,
} from '@common/dtos/pagination.dto';

type UserSummary = Pick<Users, 'referenceId' | 'firstName' | 'lastName'>;
const userSummarySelect = {
  referenceId: true,
  firstName: true,
  lastName: true,
} as const;

type UserConsentWithVersion = UserConsents & {
  legalDocumentVersion: LegalDocumentVersions;
};

type UserConsentAuditRow = UserConsents & {
  legalDocumentVersion: LegalDocumentVersions;
  user: UserSummary;
};

type ContentConsentGrantAuditRow = ContentConsentGrants & {
  uploader: UserSummary;
};

export interface ConsentsAuditFilters {
  documentType?: LegalDocumentType;
  countryId?: number;
  userReferenceId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ContentConsentGrantsAuditFilters {
  contentType?: AiDisclosureEntityType;
  usageScope?: ContentUsageScope;
  revoked?: boolean;
  uploaderReferenceId?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class LegalConsentsDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  // ── Versiones de documentos legales ──────────────────────────────────────

  async findVersionByReferenceId(
    referenceId: string,
  ): Promise<LegalDocumentVersions | null> {
    return this.prisma.extended.legalDocumentVersions.findUnique({
      where: { referenceId },
    });
  }

  async findVersionById(id: number): Promise<LegalDocumentVersions | null> {
    return this.prisma.extended.legalDocumentVersions.findUnique({
      where: { id },
    });
  }

  /**
   * Documentos activos que un usuario todavía no aceptó. Hoy `Users` no tiene un campo de país
   * (el negocio es Paraguay-only, ver `.claude/rules/datetime.md`) — se filtra solo contra
   * versiones `countryId: null` (internacionales/paraguas) hasta que exista un país por usuario;
   * cuando se agregue, esta query extiende a `OR countryId: user.countryId` sin romper nada.
   */
  async findPendingVersionsForUser(
    userId: number,
  ): Promise<LegalDocumentVersions[]> {
    return this.prisma.extended.legalDocumentVersions.findMany({
      where: {
        isActive: true,
        countryId: null,
        consents: { none: { userId } },
      },
      orderBy: { documentType: 'asc' },
    });
  }

  /**
   * Usado por `RequiresActiveConsentGuard` — ver la misma limitación de país que
   * `findPendingVersionsForUser`.
   */
  async hasActiveConsent(
    userId: number,
    documentType: LegalDocumentType,
  ): Promise<boolean> {
    const count = await this.prisma.extended.userConsents.count({
      where: {
        userId,
        legalDocumentVersion: { documentType, isActive: true, countryId: null },
      },
    });
    return count > 0;
  }

  /**
   * Usado por `ContractsService.generateContract()` para resolver `legalTermsVersionId` — misma
   * limitación de país que `findPendingVersionsForUser`/`hasActiveConsent` (siempre
   * `countryId: null` hasta que exista país por Service/User). `null` si todavía no se publicó
   * ninguna versión de este tipo — no bloquea la generación del contrato.
   */
  async findActiveVersionByType(
    documentType: LegalDocumentType,
  ): Promise<LegalDocumentVersions | null> {
    return this.prisma.extended.legalDocumentVersions.findFirst({
      where: { documentType, isActive: true, countryId: null },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findConsentByUserAndVersion(
    userId: number,
    legalDocumentVersionId: number,
  ): Promise<UserConsents | null> {
    return this.prisma.extended.userConsents.findUnique({
      where: {
        userId_legalDocumentVersionId: { userId, legalDocumentVersionId },
      },
    });
  }

  async createConsent(data: {
    userId: number;
    legalDocumentVersionId: number;
    ipAddress?: string;
    userAgent?: string;
    acceptanceHash: string;
  }): Promise<UserConsents> {
    return this.prisma.extended.userConsents.create({ data });
  }

  async findConsentHistoryForUser(
    userId: number,
  ): Promise<UserConsentWithVersion[]> {
    return this.prisma.extended.userConsents.findMany({
      where: { userId },
      include: { legalDocumentVersion: true },
      orderBy: { acceptedAt: 'desc' },
    });
  }

  // ── Consentimiento de uso por contenido ──────────────────────────────────

  async findActiveContentGrant(
    contentType: AiDisclosureEntityType,
    contentReferenceId: string,
  ): Promise<ContentConsentGrants | null> {
    return this.prisma.extended.contentConsentGrants.findFirst({
      where: { contentType, contentReferenceId, revokedAt: null },
      orderBy: { grantedAt: 'desc' },
    });
  }

  /**
   * El endpoint de revocación (`DELETE /users/me/content/:contentReferenceId/consent`) no recibe
   * `contentType` en la ruta — se busca solo por `contentReferenceId`, que es un UUID (colisión
   * entre tipos de contenido distintos, astronómicamente improbable).
   */
  async findActiveContentGrantByReferenceId(
    contentReferenceId: string,
  ): Promise<ContentConsentGrants | null> {
    return this.prisma.extended.contentConsentGrants.findFirst({
      where: { contentReferenceId, revokedAt: null },
      orderBy: { grantedAt: 'desc' },
    });
  }

  async findContentGrantsForUploader(
    uploaderUserId: number,
  ): Promise<ContentConsentGrants[]> {
    return this.prisma.extended.contentConsentGrants.findMany({
      where: { uploaderUserId },
      orderBy: { grantedAt: 'desc' },
    });
  }

  /**
   * Sin caller HTTP propio todavía — lo van a usar los flujos de subida de `0001`/`0002` cuando se
   * implementen (mismo criterio que `AiDisclosureHelper.registerPlatformDisclosure` en
   * `ai-content-disclosure.md`: el modelo y el método existen desde el día uno, el caller real
   * llega con la feature que sube contenido).
   */
  async createContentGrant(data: {
    contentType: AiDisclosureEntityType;
    contentReferenceId: string;
    uploaderUserId: number;
    usageScope?: Prisma.ContentConsentGrantsCreateInput['usageScope'];
  }): Promise<ContentConsentGrants> {
    return this.prisma.extended.contentConsentGrants.create({ data });
  }

  async revokeContentGrant(id: number): Promise<ContentConsentGrants> {
    return this.prisma.extended.contentConsentGrants.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  // ── Políticas de retención ────────────────────────────────────────────────

  /** `countryId: null` = política internacional/paraguas, misma convención que las versiones. */
  async findRetentionPolicy(
    contentType: AiDisclosureEntityType,
    countryId: number | null = null,
  ): Promise<DataRetentionPolicies | null> {
    return this.prisma.extended.dataRetentionPolicies.findUnique({
      where: { countryId_contentType: { countryId, contentType } },
    });
  }

  async findRetentionPolicies(): Promise<DataRetentionPolicies[]> {
    return this.prisma.extended.dataRetentionPolicies.findMany({
      orderBy: { contentType: 'asc' },
    });
  }

  async findRetentionPolicyByReferenceId(
    referenceId: string,
  ): Promise<DataRetentionPolicies | null> {
    return this.prisma.extended.dataRetentionPolicies.findUnique({
      where: { referenceId },
    });
  }

  async upsertRetentionPolicy(
    countryId: number | null,
    contentType: AiDisclosureEntityType,
    data: {
      retentionDays?: number | null;
      allowsUserDeletion?: boolean;
      requiresLegalHold?: boolean;
    },
  ): Promise<DataRetentionPolicies> {
    return this.prisma.extended.dataRetentionPolicies.upsert({
      where: { countryId_contentType: { countryId, contentType } },
      create: { countryId, contentType, ...data },
      update: data,
    });
  }

  // ── Administración / auditoría (staff) ───────────────────────────────────

  async findDocumentVersions(filters: {
    documentType?: LegalDocumentType;
    countryId?: number;
    isActive?: boolean;
  }): Promise<LegalDocumentVersions[]> {
    return this.prisma.extended.legalDocumentVersions.findMany({
      where: filters,
      orderBy: [{ documentType: 'asc' }, { publishedAt: 'desc' }],
    });
  }

  async createDocumentVersion(
    data: Prisma.LegalDocumentVersionsCreateInput,
  ): Promise<LegalDocumentVersions> {
    return this.prisma.extended.legalDocumentVersions.create({ data });
  }

  async updateDocumentVersion(
    id: number,
    data: Prisma.LegalDocumentVersionsUpdateInput,
  ): Promise<LegalDocumentVersions> {
    return this.prisma.extended.legalDocumentVersions.update({
      where: { id },
      data,
    });
  }

  /**
   * `UserConsents` no tiene columna `createdAt` (solo `acceptedAt`) — `PrismaPaginationUtil`
   * aplica cualquier `startDate`/`endDate` incondicionalmente sobre `createdAt`, así que ese rango
   * se resuelve acá a mano sobre `acceptedAt` y se lo excluye del objeto que recibe `paginate` (lo
   * mismo que los demás filtros anidados, que tampoco son columnas directas de la tabla).
   */
  async findConsentsAuditPaginated(
    filters: ConsentsAuditFilters,
    query: PaginationQueryDTO & Record<string, unknown>,
  ): Promise<{
    data: UserConsentAuditRow[];
    pagination: PaginationResponseDTO;
  }> {
    const where: Prisma.UserConsentsWhereInput = {};
    if (filters.documentType || filters.countryId !== undefined) {
      where.legalDocumentVersion = {
        ...(filters.documentType && { documentType: filters.documentType }),
        ...(filters.countryId !== undefined && {
          countryId: filters.countryId,
        }),
      };
    }
    if (filters.userReferenceId) {
      where.user = { referenceId: filters.userReferenceId };
    }
    if (filters.startDate || filters.endDate) {
      where.acceptedAt = {
        ...(filters.startDate && { gte: filters.startDate }),
        ...(filters.endDate && { lte: filters.endDate }),
      };
    }

    const sanitizedQuery = { ...query };
    delete sanitizedQuery.documentType;
    delete sanitizedQuery.countryId;
    delete sanitizedQuery.userReferenceId;
    delete sanitizedQuery.startDate;
    delete sanitizedQuery.endDate;

    return PrismaPaginationUtil.paginate<UserConsentAuditRow>(
      this.prisma.extended.userConsents,
      sanitizedQuery,
      {
        where,
        include: {
          legalDocumentVersion: true,
          user: { select: userSummarySelect },
        },
        defaultOrderByField: 'acceptedAt',
      },
    );
  }

  /** Ver nota de `findConsentsAuditPaginated` — `ContentConsentGrants` tampoco tiene `createdAt`. */
  async findContentConsentGrantsAuditPaginated(
    filters: ContentConsentGrantsAuditFilters,
    query: PaginationQueryDTO & Record<string, unknown>,
  ): Promise<{
    data: ContentConsentGrantAuditRow[];
    pagination: PaginationResponseDTO;
  }> {
    const where: Prisma.ContentConsentGrantsWhereInput = {};
    if (filters.contentType) where.contentType = filters.contentType;
    if (filters.usageScope) where.usageScope = filters.usageScope;
    if (filters.revoked !== undefined) {
      where.revokedAt = filters.revoked ? { not: null } : null;
    }
    if (filters.uploaderReferenceId) {
      where.uploader = { referenceId: filters.uploaderReferenceId };
    }
    if (filters.startDate || filters.endDate) {
      where.grantedAt = {
        ...(filters.startDate && { gte: filters.startDate }),
        ...(filters.endDate && { lte: filters.endDate }),
      };
    }

    const sanitizedQuery = { ...query };
    delete sanitizedQuery.contentType;
    delete sanitizedQuery.usageScope;
    delete sanitizedQuery.revoked;
    delete sanitizedQuery.uploaderReferenceId;
    delete sanitizedQuery.startDate;
    delete sanitizedQuery.endDate;

    return PrismaPaginationUtil.paginate<ContentConsentGrantAuditRow>(
      this.prisma.extended.contentConsentGrants,
      sanitizedQuery,
      {
        where,
        include: { uploader: { select: userSummarySelect } },
        defaultOrderByField: 'grantedAt',
      },
    );
  }
}
