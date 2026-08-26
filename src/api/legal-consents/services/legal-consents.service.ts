import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import {
  ContentConsentGrants,
  DataRetentionPolicies,
  LegalDocumentVersions,
  UserConsents,
} from '@prisma/client';
import { LegalConsentsDbService } from '@modules/legal-consents-db/services/legal-consents-db.service';
import { CreateLegalDocumentVersionRequestDTO } from '../dtos/request/create-legal-document-version.request.dto';
import { UpdateLegalDocumentVersionRequestDTO } from '../dtos/request/update-legal-document-version.request.dto';
import { GetLegalDocumentVersionsQueryDTO } from '../dtos/request/get-legal-document-versions.query.dto';
import { UpsertRetentionPolicyRequestDTO } from '../dtos/request/upsert-retention-policy.request.dto';
import { GetLegalConsentsAuditQueryDTO } from '../dtos/request/get-legal-consents-audit.query.dto';
import {
  PaginationQueryDTO,
  PaginationResponseDTO,
} from '@common/dtos/pagination.dto';

import { t } from '@common/i18n/i18n.helper';

@Injectable()
export class LegalConsentsService {
  constructor(private readonly legalConsentsDb: LegalConsentsDbService) {}

  // ── Usuario ────────────────────────────────────────────────────────────

  async findPendingForUser(userId: number): Promise<LegalDocumentVersions[]> {
    return this.legalConsentsDb.findPendingVersionsForUser(userId);
  }

  async acceptVersion(
    userId: number,
    versionReferenceId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<UserConsents> {
    const version =
      await this.legalConsentsDb.findVersionByReferenceId(versionReferenceId);
    if (!version) {
      throw new NotFoundException(
        t('legal-consents.DOCUMENT_VERSION_NOT_FOUND'),
      );
    }

    const existing = await this.legalConsentsDb.findConsentByUserAndVersion(
      userId,
      version.id,
    );
    if (existing) {
      throw new ConflictException(
        t('legal-consents.DOCUMENT_VERSION_ALREADY_ACCEPTED'),
      );
    }

    const acceptedAt = new Date();
    // Huella no repudiable del evento de aceptación (usuario+versión+momento exacto) — no es una
    // firma criptográfica de identidad, es evidencia de auditoría de "esto se aceptó, así, en este
    // instante", coherente con el uso que le da `GET /admin/legal/consents`.
    const acceptanceHash = createHash('sha256')
      .update(`${userId}:${version.id}:${acceptedAt.toISOString()}`)
      .digest('hex');

    return this.legalConsentsDb.createConsent({
      userId,
      legalDocumentVersionId: version.id,
      ipAddress,
      userAgent,
      acceptanceHash,
    });
  }

  async findDataConsentsHistory(userId: number): Promise<{
    consents: Awaited<
      ReturnType<LegalConsentsDbService['findConsentHistoryForUser']>
    >;
    contentGrants: ContentConsentGrants[];
  }> {
    const [consents, contentGrants] = await Promise.all([
      this.legalConsentsDb.findConsentHistoryForUser(userId),
      this.legalConsentsDb.findContentGrantsForUploader(userId),
    ]);
    return { consents, contentGrants };
  }

  async revokeContentConsent(
    uploaderUserId: number,
    contentReferenceId: string,
  ): Promise<void> {
    const grant =
      await this.legalConsentsDb.findActiveContentGrantByReferenceId(
        contentReferenceId,
      );
    if (!grant) {
      throw new NotFoundException(
        t('legal-consents.CONTENT_CONSENT_NOT_FOUND'),
      );
    }
    if (grant.uploaderUserId !== uploaderUserId) {
      throw new ConflictException(t('legal-consents.NOT_CONTENT_OWNER'));
    }

    const policy = await this.legalConsentsDb.findRetentionPolicy(
      grant.contentType,
    );
    if (policy?.requiresLegalHold) {
      throw new ConflictException({
        message: t('legal-consents.LEGAL_HOLD_ACTIVE'),
        errorCode: 'LEGAL_HOLD_ACTIVE',
      });
    }

    await this.legalConsentsDb.revokeContentGrant(grant.id);
  }

  // ── Staff (admin) ─────────────────────────────────────────────────────

  async findDocumentVersions(
    query: GetLegalDocumentVersionsQueryDTO,
  ): Promise<LegalDocumentVersions[]> {
    return this.legalConsentsDb.findDocumentVersions(query);
  }

  async createDocumentVersion(
    dto: CreateLegalDocumentVersionRequestDTO,
    createdBy: string,
  ): Promise<LegalDocumentVersions> {
    return this.legalConsentsDb.createDocumentVersion({
      documentType: dto.documentType,
      version: dto.version,
      contentUrl: dto.contentUrl,
      publishedAt: new Date(dto.publishedAt),
      isActive: dto.isActive,
      createdBy,
      country: dto.countryId ? { connect: { id: dto.countryId } } : undefined,
    });
  }

  async updateDocumentVersion(
    referenceId: string,
    dto: UpdateLegalDocumentVersionRequestDTO,
    lastChangedBy: string,
  ): Promise<LegalDocumentVersions> {
    const version =
      await this.legalConsentsDb.findVersionByReferenceId(referenceId);
    if (!version) {
      throw new NotFoundException(
        t('legal-consents.DOCUMENT_VERSION_NOT_FOUND'),
      );
    }

    return this.legalConsentsDb.updateDocumentVersion(version.id, {
      ...dto,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
      lastChangedBy,
      lastChangedAt: new Date(),
    });
  }

  async findRetentionPolicies(): Promise<DataRetentionPolicies[]> {
    return this.legalConsentsDb.findRetentionPolicies();
  }

  async upsertRetentionPolicy(
    dto: UpsertRetentionPolicyRequestDTO,
  ): Promise<DataRetentionPolicies> {
    return this.legalConsentsDb.upsertRetentionPolicy(
      dto.countryId ?? null,
      dto.contentType,
      {
        retentionDays: dto.retentionDays,
        allowsUserDeletion: dto.allowsUserDeletion,
        requiresLegalHold: dto.requiresLegalHold,
      },
    );
  }

  async findConsentsAuditPaginated(
    query: GetLegalConsentsAuditQueryDTO,
  ): Promise<{
    data: Awaited<
      ReturnType<LegalConsentsDbService['findConsentsAuditPaginated']>
    >['data'];
    pagination: PaginationResponseDTO;
  }> {
    return this.legalConsentsDb.findConsentsAuditPaginated(
      query as unknown as PaginationQueryDTO & Record<string, unknown>,
    );
  }
}
