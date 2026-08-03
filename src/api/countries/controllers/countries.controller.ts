import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CountriesService } from '../services/countries.service';
import { GetCountriesListQueryDTO, CountryIdParamDTO } from '../dtos/request';
import {
  CountryResponseDTO,
  GetCountriesListResponseDTO,
} from '../dtos/response';
import { ApiGetCountriesList, ApiGetCountryById } from '../docs/countries.docs';

// Catálogo de referencia de solo lectura y bajo riesgo. Se sigue el patrón real confirmado
// de los otros catálogos del proyecto (service-types, endpoints de listado de categories):
// endpoints GET públicos sin guard. La escritura no se expone por API (seed/migración).
@ApiTags('Países')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @ApiGetCountriesList()
  async findAll(
    @Query() query: GetCountriesListQueryDTO,
  ): Promise<GetCountriesListResponseDTO> {
    return this.countriesService.findAll(query);
  }

  @Get(':id')
  @ApiGetCountryById()
  async findOne(
    @Param() param: CountryIdParamDTO,
  ): Promise<CountryResponseDTO> {
    return this.countriesService.findOne(param.id);
  }
}
