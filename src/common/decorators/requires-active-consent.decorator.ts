import { SetMetadata } from '@nestjs/common';
import { LegalDocumentType } from '@prisma/client';

export const REQUIRES_ACTIVE_CONSENT_KEY = 'requiresActiveConsent';

// Marca un endpoint de subida como bloqueado por RequiresActiveConsentGuard hasta que el usuario
// tenga un UserConsents vigente para el LegalDocumentType indicado — ver
// src/api/legal-consents/guards/requires-active-consent.guard.ts.
export const RequiresActiveConsent = (documentType: LegalDocumentType) =>
  SetMetadata(REQUIRES_ACTIVE_CONSENT_KEY, documentType);
