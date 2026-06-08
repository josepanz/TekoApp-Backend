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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { ApplyPromotionDto } from './dto/apply-promotion.dto';
import { PromotionIdParamDTO } from './dto/promotion-id.param.dto';
import { ValidatePromotionRequestDTO } from './dto/validate-promotion.request.dto';

@ApiTags('Promociones')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva promoción' })
  @ApiResponse({ status: 201, description: 'Promoción creada exitosamente' })
  create(
    @Body() createPromotionDto: CreatePromotionDto,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.promotionsService.create(createPromotionDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las promociones' })
  @ApiResponse({ status: 200, description: 'Lista de promociones' })
  findAll() {
    return this.promotionsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Obtener promociones activas' })
  @ApiResponse({ status: 200, description: 'Lista de promociones activas' })
  findActive() {
    return this.promotionsService.findActive();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estadísticas de promociones' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas' })
  getStats() {
    return this.promotionsService.getPromotionStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una promoción por ID' })
  @ApiResponse({ status: 200, description: 'Promoción encontrada' })
  @ApiResponse({ status: 404, description: 'Promoción no encontrada' })
  findOne(@Param() param: PromotionIdParamDTO) {
    return this.promotionsService.findOne(param.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una promoción' })
  @ApiResponse({ status: 200, description: 'Promoción actualizada' })
  update(
    @Param() param: PromotionIdParamDTO,
    @Body() updatePromotionDto: Partial<CreatePromotionDto>,
  ) {
    return this.promotionsService.update(param.id, updatePromotionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una promoción' })
  @ApiResponse({ status: 200, description: 'Promoción eliminada' })
  remove(@Param() param: PromotionIdParamDTO) {
    return this.promotionsService.remove(param.id);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validar un código de promoción' })
  @ApiResponse({ status: 200, description: 'Resultado de validación' })
  validatePromotion(
    @Body() dto: ValidatePromotionRequestDTO,
    @Request() req: { user: IUserDataOnJwt & { role?: string } },
  ) {
    return this.promotionsService.validatePromotion(
      dto.code,
      req.user.id,
      req.user.role,
      dto.serviceAmount,
    );
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aplicar una promoción' })
  @ApiResponse({ status: 200, description: 'Promoción aplicada' })
  applyPromotion(
    @Body() applyPromotionDto: ApplyPromotionDto,
    @Request() req: { user: IUserDataOnJwt & { role?: string } },
  ) {
    return this.promotionsService.applyPromotion({
      ...applyPromotionDto,
      userId: req.user.id,
      userType: req.user.role,
    });
  }
}
