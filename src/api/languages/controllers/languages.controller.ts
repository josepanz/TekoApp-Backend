import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LanguagesService } from '../services/languages.service';
import { LanguageIdParamDTO } from '../dtos/request';
import { LanguageResponseDTO } from '../dtos/response';
import {
  ApiGetLanguagesList,
  ApiGetLanguageById,
} from '../docs/languages.docs';

// Catálogo de referencia de solo lectura (mismo criterio de guards que countries/service-types:
// GET públicos, escritura vía seed/migración).
@ApiTags('Idiomas')
@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Get()
  @ApiGetLanguagesList()
  async findAll(): Promise<LanguageResponseDTO[]> {
    return this.languagesService.findAll();
  }

  @Get(':id')
  @ApiGetLanguageById()
  async findOne(
    @Param() param: LanguageIdParamDTO,
  ): Promise<LanguageResponseDTO> {
    return this.languagesService.findOne(param.id);
  }
}
