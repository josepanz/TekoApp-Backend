import { Injectable } from '@nestjs/common';
import { ProfessionalDocumentsDbService } from '../services/professional-documents-db.service';
import { ProfessionalDocumentTypesDbService } from '@modules/professional-document-types-db/services/professional-document-types-db.service';
import { ProfessionalsDbService } from '@modules/professionals-db/services/professionals-db.service';

/**
 * Recalcula `Professionals.requiredDocumentsVerified` — pasa a `true` cuando TODOS los
 * `ProfessionalDocumentTypes` con `isRequired=true` que aplican a la categoría del profesional
 * tienen un `ProfessionalDocuments` `APPROVED` y sin vencer (ver openspec/specs/professional-documents.md).
 * Si no hay ningún tipo requerido aplicable, la condición se cumple vacuamente → `true`.
 *
 * **Nunca tocar `verificationStatus`** — es la aprobación manual de staff sobre la cuenta
 * (`ProfessionalsService.verifyProfessional()`, ligada a `status`/onboarding), un concepto
 * distinto con su propio escritor. Colisión real encontrada al implementar esta fase — ver
 * `openspec/decisions.md`.
 */
@Injectable()
export class ProfessionalVerificationHelper {
  constructor(
    private readonly documentsDb: ProfessionalDocumentsDbService,
    private readonly documentTypesDb: ProfessionalDocumentTypesDbService,
    private readonly professionalsDb: ProfessionalsDbService,
  ) {}

  async recompute(professionalId: number): Promise<void> {
    const professional = await this.professionalsDb.findById(professionalId);
    const applicableTypes =
      await this.documentTypesDb.findApplicableForCategory(
        professional.categoryId,
      );
    const requiredTypeIds = applicableTypes
      .filter((type) => type.isRequired)
      .map((type) => type.id);

    const approvedFlags = await Promise.all(
      requiredTypeIds.map((typeId) =>
        this.documentsDb.hasActiveApproved(professionalId, typeId),
      ),
    );
    const verified = approvedFlags.every(Boolean);

    if (professional.requiredDocumentsVerified !== verified) {
      await this.professionalsDb.update(professionalId, {
        requiredDocumentsVerified: verified,
      });
    }
  }
}
