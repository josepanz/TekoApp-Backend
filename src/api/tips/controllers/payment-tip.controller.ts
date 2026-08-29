import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PaymentIdParamDTO } from '@api/payments/dtos/request';
import { TipsService } from '../services/tips.service';
import { CreateTipRequestDTO } from '../dtos/request';
import { TipResponseDTO } from '../dtos/response';
import { CreateTipDocs, GetTipDocs } from '../docs/tips.docs';

interface RequestWithUser {
  user: { id: number };
}

@ApiTags('Propinas')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentTipController {
  constructor(private readonly service: TipsService) {}

  @Post(':id/tip')
  @HttpCode(HttpStatus.CREATED)
  @CreateTipDocs()
  async create(
    @Param() param: PaymentIdParamDTO,
    @Request() req: RequestWithUser,
    @Body() dto: CreateTipRequestDTO,
  ): Promise<TipResponseDTO> {
    return this.service.createTip(param.id, req.user.id, dto);
  }

  @Get(':id/tip')
  @GetTipDocs()
  async get(@Param() param: PaymentIdParamDTO): Promise<TipResponseDTO | null> {
    return this.service.getTip(param.id);
  }
}
