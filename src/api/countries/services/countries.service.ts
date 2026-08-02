import { Injectable, NotFoundException } from '@nestjs/common';
import { CountriesDbService } from '@modules/countries-db/services/countries-db.service';
import { GetCountriesListQueryDTO } from '../dtos/request';
import {
  CountryResponseDTO,
  GetCountriesListResponseDTO,
} from '../dtos/response';

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
      throw new NotFoundException('País no encontrado');
    }
    return country;
  }
}
