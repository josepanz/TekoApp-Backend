import { Injectable, NotFoundException } from '@nestjs/common';
import { LanguagesDbService } from '@modules/languages-db/services/languages-db.service';
import { LanguageResponseDTO } from '../dtos/response';

import { t } from '@common/i18n/i18n.helper';
@Injectable()
export class LanguagesService {
  constructor(private readonly languagesDb: LanguagesDbService) {}

  async findAll(): Promise<LanguageResponseDTO[]> {
    const result = await this.languagesDb.findAllActive();
    return result;
  }

  async findOne(id: number): Promise<LanguageResponseDTO> {
    const language = await this.languagesDb.findById(id);
    if (!language) {
      throw new NotFoundException(t('languages.NOT_FOUND'));
    }
    return language;
  }
}
