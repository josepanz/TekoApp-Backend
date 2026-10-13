import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProfessionalDocumentTypes } from '@prisma/client';
import { PrismaErrorCodes } from '@common/enum/prisma-error-codes.enum';
import { ProfessionalDocumentTypesDbService } from '@modules/professional-document-types-db/services/professional-document-types-db.service';
import { t } from '@common/i18n/i18n.helper';
import {
  CreateProfessionalDocumentTypeRequestDTO,
  GetProfessionalDocumentTypesListQueryDTO,
  UpdateProfessionalDocumentTypeRequestDTO,
} from '../dtos/request';

@Injectable()
export class ProfessionalDocumentTypesService {
  constructor(private readonly db: ProfessionalDocumentTypesDbService) {}

  async list(
    query: GetProfessionalDocumentTypesListQueryDTO,
  ): Promise<{ data: ProfessionalDocumentTypes[] }> {
    const data = await this.db.findFiltered({
      countryId: query.countryId,
      professionalCategoryId: query.professionalCategoryId,
      category: query.category,
    });
    return { data };
  }

  async create(
    dto: CreateProfessionalDocumentTypeRequestDTO,
    createdBy: string,
  ): Promise<ProfessionalDocumentTypes> {
    try {
      return await this.db.create({ ...dto, createdBy });
    } catch (error) {
      this.rethrowIfDuplicateCode(error);
      throw error;
    }
  }

  async update(
    referenceId: string,
    dto: UpdateProfessionalDocumentTypeRequestDTO,
    lastChangedBy: string,
  ): Promise<ProfessionalDocumentTypes> {
    const existing = await this.db.findByReferenceId(referenceId);
    if (!existing) {
      throw new NotFoundException(t('professional-document-types.NOT_FOUND'));
    }
    try {
      return await this.db.update(existing.id, { ...dto, lastChangedBy });
    } catch (error) {
      this.rethrowIfDuplicateCode(error);
      throw error;
    }
  }

  /** DEF-BE-010: `code` es único; el P2002 de Prisma se traduce a 409 en vez de caer en 500. */
  private rethrowIfDuplicateCode(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === (PrismaErrorCodes.UniqueConstraintFailed as string)
    ) {
      throw new ConflictException(
        t('professional-document-types.CODE_ALREADY_EXISTS'),
      );
    }
  }
}
