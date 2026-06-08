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
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { ApplyPromotionDto } from './dto/apply-promotion.dto';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createPromotionDto: CreatePromotionDto,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.promotionsService.create(createPromotionDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.promotionsService.findAll();
  }

  @Get('active')
  findActive() {
    return this.promotionsService.findActive();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats() {
    return this.promotionsService.getPromotionStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updatePromotionDto: Partial<CreatePromotionDto>,
  ) {
    return this.promotionsService.update(id, updatePromotionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  validatePromotion(
    @Body()
    validationData: {
      code: string;
      serviceAmount: number;
    },
    @Request() req: { user: IUserDataOnJwt & { role?: string } },
  ) {
    return this.promotionsService.validatePromotion(
      validationData.code,
      req.user.id,
      req.user.role,
      validationData.serviceAmount,
    );
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
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
