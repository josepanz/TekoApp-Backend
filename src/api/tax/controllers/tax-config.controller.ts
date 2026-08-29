import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { TaxService } from '../services/tax.service';
import { TaxConfigResponseDTO } from '../dtos/response';
import { GetTaxConfigDocs } from '../docs/tax.docs';

@ApiTags('Impuestos')
@Controller('tax')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TaxConfigController {
  constructor(private readonly service: TaxService) {}

  @Get('config')
  @GetTaxConfigDocs()
  async getConfig(): Promise<TaxConfigResponseDTO> {
    return this.service.getConfig();
  }
}
