import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrenciesService } from '../services/currencies.service';
import { CurrencyCodeParamDTO } from '../dtos/request';
import { CurrencyResponseDTO } from '../dtos/response';
import {
  ApiGetCurrenciesList,
  ApiGetCurrencyByCode,
} from '../docs/currencies.docs';

// Catálogo de referencia de solo lectura (mismo criterio de guards que countries/service-types:
// GET públicos, escritura vía seed/migración). El detalle usa la PK natural `alphaCode`, no `:id`.
@ApiTags('Monedas')
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  @ApiGetCurrenciesList()
  async findAll(): Promise<CurrencyResponseDTO[]> {
    return this.currenciesService.findAll();
  }

  @Get(':alphaCode')
  @ApiGetCurrencyByCode()
  async findOne(
    @Param() param: CurrencyCodeParamDTO,
  ): Promise<CurrencyResponseDTO> {
    return this.currenciesService.findOne(param.alphaCode);
  }
}
