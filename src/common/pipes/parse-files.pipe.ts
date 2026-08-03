import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

import { t } from '@common/i18n/i18n.helper';
@Injectable()
export class ParseFilesPipe implements PipeTransform {
  /**
   * @param options.requiredFields Lista de campos que deben estar presentes obligatoriamente
   */
  constructor(private readonly options?: { requiredFields?: string[] }) {}

  transform(files: Record<string, Express.Multer.File[]>) {
    // 1. Verificar si se subió algo
    if (!files || Object.keys(files).length === 0) {
      throw new BadRequestException(t('common.FILES_NOT_PROVIDED'));
    }

    // 2. Verificar campos obligatorios (si se definieron)
    if (this.options?.requiredFields) {
      for (const field of this.options.requiredFields) {
        if (!files[field] || files[field].length === 0) {
          throw new BadRequestException(
            t('common.FILE_FIELD_REQUIRED', { field }),
          );
        }
      }
    }

    return files;
  }
}
