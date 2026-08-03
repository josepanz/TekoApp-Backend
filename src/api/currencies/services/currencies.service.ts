import { Injectable, NotFoundException } from '@nestjs/common';
import { CurrenciesDbService } from '@modules/currencies-db/services/currencies-db.service';
import { CurrencyResponseDTO } from '../dtos/response';

import { t } from '@common/i18n/i18n.helper';
@Injectable()
export class CurrenciesService {
  constructor(private readonly currenciesDb: CurrenciesDbService) {}

  async findAll(): Promise<CurrencyResponseDTO[]> {
    const result = await this.currenciesDb.findAllActive();
    return result;
  }

  async findOne(alphaCode: string): Promise<CurrencyResponseDTO> {
    const currency = await this.currenciesDb.findByAlphaCode(alphaCode);
    if (!currency) {
      throw new NotFoundException(t('currencies.NOT_FOUND'));
    }
    return currency;
  }
}
