import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfessionalDocumentTypes } from '@prisma/client';
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
    return this.db.create({ ...dto, createdBy });
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
    return this.db.update(existing.id, { ...dto, lastChangedBy });
  }
}
