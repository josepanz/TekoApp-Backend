import { Injectable } from '@nestjs/common';
import {
  DocumentReviewStatus,
  PortfolioReviewStatus,
  ProfessionalStatus,
  ServiceStatus,
} from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';

/** A qué registro pertenece una key de S3, resuelto SIEMPRE desde la DB (nunca desde la key). */
export type StorageKeyOwner =
  | {
      kind: 'professional-document';
      ownerUserId: number;
      /** Aprobado y de un tipo visible al cliente: lo ve cualquier usuario autenticado. */
      isPublic: boolean;
    }
  | {
      kind: 'portfolio-item';
      ownerUserId: number;
      /** Aprobado, visible y activo: lo ve cualquier usuario autenticado. */
      isPublic: boolean;
    }
  | { kind: 'avatar'; ownerUserId: number }
  | { kind: 'contract'; clientUserId: number; professionalUserId: number }
  | {
      kind: 'service-progress';
      clientUserId: number;
      professionalUserId: number | null;
      authorUserId: number;
    }
  | {
      kind: 'service-image';
      clientUserId: number | null;
      professionalUserId: number | null;
      status: ServiceStatus;
    };

/**
 * Resuelve qué registro referencia una key de S3. El orden es la prioridad de sensibilidad: si una
 * key figura en un documento/portafolio/avatar/contrato, solo rigen las reglas de ese registro, aunque
 * alguien la haya adjuntado también a un servicio o a una entrada de bitácora (key forjada).
 */
@Injectable()
export class StorageAccessDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async findOwnerByKey(key: string): Promise<StorageKeyOwner | null> {
    const db = this.prisma.extended;

    const document = await db.professionalDocuments.findFirst({
      where: { fileKey: key },
      include: {
        professional: { select: { userId: true } },
        professionalDocumentType: { select: { isVisibleToClient: true } },
      },
    });
    if (document) {
      return {
        kind: 'professional-document',
        ownerUserId: document.professional.userId,
        isPublic:
          document.isActive &&
          document.status === DocumentReviewStatus.APPROVED &&
          document.professionalDocumentType.isVisibleToClient,
      };
    }

    const portfolio = await db.professionalPortfolioItems.findFirst({
      where: { fileKey: key },
      include: { professional: { select: { userId: true } } },
    });
    if (portfolio) {
      return {
        kind: 'portfolio-item',
        ownerUserId: portfolio.professional.userId,
        isPublic:
          portfolio.isActive &&
          portfolio.isVisible &&
          portfolio.status === PortfolioReviewStatus.APPROVED,
      };
    }

    const avatarOwner = await db.users.findFirst({
      where: { avatarKey: key },
      select: { id: true },
    });
    if (avatarOwner) return { kind: 'avatar', ownerUserId: avatarOwner.id };

    const contract = await db.contracts.findFirst({
      where: { pdfKey: key },
      select: {
        clientUserId: true,
        professional: { select: { userId: true } },
      },
    });
    if (contract) {
      return {
        kind: 'contract',
        clientUserId: contract.clientUserId,
        professionalUserId: contract.professional.userId,
      };
    }

    const progress = await db.serviceProgressEntries.findFirst({
      where: { images: { has: key } },
      select: {
        professional: { select: { userId: true } },
        service: {
          select: {
            userId: true,
            professional: { select: { userId: true } },
          },
        },
      },
    });
    if (progress) {
      return {
        kind: 'service-progress',
        clientUserId: progress.service.userId,
        professionalUserId: progress.service.professional?.userId ?? null,
        authorUserId: progress.professional.userId,
      };
    }

    const service = await db.services.findFirst({
      where: { images: { has: key } },
      select: {
        userId: true,
        status: true,
        professional: { select: { userId: true } },
      },
    });
    if (service) {
      return {
        kind: 'service-image',
        clientUserId: service.userId,
        professionalUserId: service.professional?.userId ?? null,
        status: service.status,
      };
    }

    return null;
  }

  /** ¿El usuario tiene un perfil profesional APPROVED y activo? (explora el marketplace). */
  async isOperatingProfessional(userId: number): Promise<boolean> {
    const professional = await this.prisma.extended.professionals.findUnique({
      where: { userId },
      select: { status: true, isActive: true },
    });
    return (
      !!professional &&
      professional.status === ProfessionalStatus.APPROVED &&
      professional.isActive
    );
  }
}
