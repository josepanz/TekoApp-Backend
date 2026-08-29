import {
  ContentConsentGrants,
  LegalDocumentVersions,
  UserConsents,
  Users,
} from '@prisma/client';
import { UserConsentAuditResponseDTO } from '../dtos/response/user-consent-audit.response.dto';
import { LegalDocumentVersionResponseDTO } from '../dtos/response/legal-document-version.response.dto';
import { ContentConsentGrantAuditResponseDTO } from '../dtos/response/content-consent-grant-audit.response.dto';

type UserSummary = Pick<Users, 'referenceId' | 'firstName' | 'lastName'>;

function mapVersionToResponse(
  version: LegalDocumentVersions,
): LegalDocumentVersionResponseDTO {
  return {
    referenceId: version.referenceId,
    documentType: version.documentType,
    countryId: version.countryId,
    version: version.version,
    contentUrl: version.contentUrl,
    publishedAt: version.publishedAt,
    isActive: version.isActive,
  };
}

// Mapeo explícito (no cast crudo) porque este DTO expone campos sensibles (IP, user-agent, hash de
// aceptación) — controlar a mano exactamente qué sale, ver openspec/decisions.md, Fase 0006 (ext).
export function mapUserConsentAuditToResponse(
  consent: UserConsents & {
    legalDocumentVersion: LegalDocumentVersions;
    user: UserSummary;
  },
): UserConsentAuditResponseDTO {
  return {
    referenceId: consent.referenceId,
    acceptedAt: consent.acceptedAt,
    legalDocumentVersion: mapVersionToResponse(consent.legalDocumentVersion),
    user: {
      referenceId: consent.user.referenceId,
      firstName: consent.user.firstName,
      lastName: consent.user.lastName,
    },
    ipAddress: consent.ipAddress,
    userAgent: consent.userAgent,
    acceptanceHash: consent.acceptanceHash,
  };
}

export function mapUserConsentsAuditToResponse(
  consents: (UserConsents & {
    legalDocumentVersion: LegalDocumentVersions;
    user: UserSummary;
  })[],
): UserConsentAuditResponseDTO[] {
  return consents.map(mapUserConsentAuditToResponse);
}

export function mapContentConsentGrantAuditToResponse(
  grant: ContentConsentGrants & { uploader: UserSummary },
): ContentConsentGrantAuditResponseDTO {
  return {
    referenceId: grant.referenceId,
    contentType: grant.contentType,
    contentReferenceId: grant.contentReferenceId,
    usageScope: grant.usageScope,
    grantedAt: grant.grantedAt,
    revokedAt: grant.revokedAt,
    uploader: {
      referenceId: grant.uploader.referenceId,
      firstName: grant.uploader.firstName,
      lastName: grant.uploader.lastName,
    },
  };
}

export function mapContentConsentGrantsAuditToResponse(
  grants: (ContentConsentGrants & { uploader: UserSummary })[],
): ContentConsentGrantAuditResponseDTO[] {
  return grants.map(mapContentConsentGrantAuditToResponse);
}
