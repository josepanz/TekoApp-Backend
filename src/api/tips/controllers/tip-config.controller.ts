import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { TipsService } from '../services/tips.service';
import { TipConfigResponseDTO } from '../dtos/response';
import { GetTipConfigDocs } from '../docs/tips.docs';

@ApiTags('Propinas')
@Controller('tips')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TipConfigController {
  constructor(private readonly service: TipsService) {}

  @Get('config')
  @GetTipConfigDocs()
  async getConfig(): Promise<TipConfigResponseDTO> {
    return this.service.getConfig();
  }
}
