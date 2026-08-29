import { Injectable } from '@nestjs/common';
import {
  AiContentDisclosures,
  AiDisclosureEntityType,
  AiDisclosureSource,
} from '@prisma/client';
import { AiDisclosuresDbService } from '../services/ai-disclosures-db.service';

/**
 * Preparado para una futura feature de IA generativa de plataforma — hoy no hay ningún caller real
 * (la plataforma no integra ningún proveedor de IA, ver `openspec/specs/ai-content-disclosure.md`).
 * Cuando exista, llamar esto en la misma operación de creación de la entidad generada.
 */
@Injectable()
export class AiDisclosureHelper {
  constructor(private readonly aiDisclosuresDb: AiDisclosuresDbService) {}

  async registerPlatformDisclosure(
    entityType: AiDisclosureEntityType,
    entityReferenceId: string,
    aiProvider?: string,
  ): Promise<AiContentDisclosures> {
    return this.aiDisclosuresDb.upsertDisclosure({
      entityType,
      entityReferenceId,
      source: AiDisclosureSource.PLATFORM_AI,
      aiProvider,
    });
  }
}
