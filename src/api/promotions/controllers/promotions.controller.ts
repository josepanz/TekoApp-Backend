import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { PromotionsService } from '../services/promotions.service';
import { CreatePromotionRequestDTO } from '../dtos/request/create-promotion.request.dto';
import { ApplyPromotionRequestDTO } from '../dtos/request/apply-promotion.request.dto';
import { PromotionIdParamDTO } from '../dtos/request/promotion-id.param.dto';
import { ValidatePromotionRequestDTO } from '../dtos/request/validate-promotion.request.dto';
import {
  PromotionDetailResponseDTO,
  PromotionApplyResponseDTO,
  PromotionValidateResponseDTO,
  PromotionStatsResponseDTO,
} from '../dtos/response';
import {
  ApiCreatePromotion,
  ApiGetPromotions,
  ApiGetActivePromotions,
  ApiGetPromotionStats,
  ApiGetPromotionById,
  ApiUpdatePromotion,
  ApiDeletePromotion,
  ApiValidatePromotion,
  ApiApplyPromotion,
} from '../docs/promotions.docs';

@ApiTags('Promociones')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreatePromotion()
  create(
    @Body() createPromotionDto: CreatePromotionRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<PromotionDetailResponseDTO> {
    return this.promotionsService.create(createPromotionDto, req.user.id);
  }

  @Get()
  @ApiGetPromotions()
  findAll(): Promise<PromotionDetailResponseDTO[]> {
    return this.promotionsService.findAll();
  }

  @Get('active')
  @ApiGetActivePromotions()
  findActive(): Promise<PromotionDetailResponseDTO[]> {
    return this.promotionsService.findActive();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiGetPromotionStats()
  getStats(): Promise<PromotionStatsResponseDTO> {
    return this.promotionsService.getPromotionStats();
  }

  @Get(':id')
  @ApiGetPromotionById()
  findOne(
    @Param() param: PromotionIdParamDTO,
  ): Promise<PromotionDetailResponseDTO> {
    return this.promotionsService.findOne(param.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiUpdatePromotion()
  update(
    @Param() param: PromotionIdParamDTO,
    @Body() updatePromotionDto: Partial<CreatePromotionRequestDTO>,
  ): Promise<PromotionDetailResponseDTO> {
    return this.promotionsService.update(param.id, updatePromotionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiDeletePromotion()
  remove(
    @Param() param: PromotionIdParamDTO,
  ): Promise<PromotionDetailResponseDTO> {
    return this.promotionsService.remove(param.id);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiValidatePromotion()
  validatePromotion(
    @Body() dto: ValidatePromotionRequestDTO,
    @Request() req: { user: IUserDataOnJwt & { role?: string } },
  ): Promise<PromotionValidateResponseDTO> {
    return this.promotionsService.validatePromotion(
      dto.code,
      req.user.id,
      req.user.role ?? '',
      dto.serviceAmount,
    );
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiApplyPromotion()
  applyPromotion(
    @Body() applyPromotionDto: ApplyPromotionRequestDTO,
    @Request() req: { user: IUserDataOnJwt & { role?: string } },
  ): Promise<PromotionApplyResponseDTO> {
    return this.promotionsService.applyPromotion({
      ...applyPromotionDto,
      userId: req.user.id,
      userType: req.user.role ?? '',
    });
  }
}
