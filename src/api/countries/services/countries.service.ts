import { Injectable, NotFoundException } from '@nestjs/common';
import { CountriesDbService } from '@modules/countries-db/services/countries-db.service';
import { GetCountriesListQueryDTO } from '../dtos/request';
import {
  CountryResponseDTO,
  GetCountriesListResponseDTO,
} from '../dtos/response';

import { t } from '@common/i18n/i18n.helper';
@Injectable()
export class CountriesService {
  constructor(private readonly countriesDb: CountriesDbService) {}

  async findAll(
    query: GetCountriesListQueryDTO,
  ): Promise<GetCountriesListResponseDTO> {
    const { data, pagination } = await this.countriesDb.findPaginated(
      query as unknown as Parameters<CountriesDbService['findPaginated']>[0],
    );
    return {
      data: data as unknown as CountryResponseDTO[],
      pagination,
    };
  }

  async findOne(id: number): Promise<CountryResponseDTO> {
    const country = await this.countriesDb.findById(id);
    if (!country) {
      throw new NotFoundException(t('countries.NOT_FOUND'));
    }
    return country;
  }
}
