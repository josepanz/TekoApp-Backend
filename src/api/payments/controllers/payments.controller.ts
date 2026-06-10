import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { PaymentApiService } from '../services/payments.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  RefundPaymentDto,
  UpdatePaymentMethodDto,
  PaymentIdParamDTO,
  PaymentMethodIdParamDTO,
  PaymentWebhookParamDTO,
  PaymentListQueryDTO,
  PaymentSummaryQueryDTO,
  PaymentTrendsQueryDTO,
  CreatePaymentMethodRequestDTO,
} from '../dtos/request';
import {
  PaymentDetailResponseDTO,
  PaymentMethodDetailResponseDTO,
  PaymentSummaryResponseDTO,
  PaymentTrendsResponseDTO,
} from '../dtos/response';
import {
  ApiCreatePayment,
  ApiGetPayments,
  ApiGetPaymentSummary,
  ApiGetPaymentTrends,
  ApiGetPaymentById,
  ApiUpdatePayment,
  ApiCancelPayment,
  ApiRefundPayment,
  ApiCreatePaymentMethod,
  ApiUpdatePaymentMethod,
  ApiDeletePaymentMethod,
  ApiHandleWebhook,
} from '../docs/payments.docs';

@ApiTags('Pagos')
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly apiService: PaymentApiService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatePayment()
  async create(
    @Body() dto: CreatePaymentDto,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<PaymentDetailResponseDTO> {
    return this.apiService.createPayment(
      req.user.id,
      dto,
    ) as unknown as Promise<PaymentDetailResponseDTO>;
  }

  @Get()
  @ApiGetPayments()
  async findAll(
    @Query() query: PaymentListQueryDTO,
  ): Promise<PaymentDetailResponseDTO[]> {
    return this.apiService.getPayments(
      query.userId,
      query.professionalId,
      query.status,
    ) as unknown as Promise<PaymentDetailResponseDTO[]>;
  }

  @Get('summary')
  @ApiGetPaymentSummary()
  async getSummary(
    @Query() query: PaymentSummaryQueryDTO,
  ): Promise<PaymentSummaryResponseDTO> {
    return this.apiService.getMetricsSummary(
      query.userId,
      query.professionalId,
    );
  }

  @Get('trends')
  @ApiGetPaymentTrends()
  async getTrends(
    @Query() query: PaymentTrendsQueryDTO,
  ): Promise<PaymentTrendsResponseDTO> {
    return this.apiService.getMetricsTrends(query.days, query.userId);
  }

  @Get(':id')
  @ApiGetPaymentById()
  async findOne(
    @Param() param: PaymentIdParamDTO,
  ): Promise<PaymentDetailResponseDTO> {
    return this.apiService.getPaymentById(
      param.id,
    ) as unknown as Promise<PaymentDetailResponseDTO>;
  }

  @Put(':id')
  @ApiUpdatePayment()
  async update(
    @Param() param: PaymentIdParamDTO,
    @Body() dto: UpdatePaymentDto,
  ): Promise<PaymentDetailResponseDTO> {
    return this.apiService.updatePayment(
      param.id,
      dto,
    ) as unknown as Promise<PaymentDetailResponseDTO>;
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiCancelPayment()
  async cancel(
    @Param() param: PaymentIdParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<PaymentDetailResponseDTO> {
    return this.apiService.cancelPayment(
      param.id,
      req.user.id,
    ) as unknown as Promise<PaymentDetailResponseDTO>;
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiRefundPayment()
  async refund(
    @Param() param: PaymentIdParamDTO,
    @Body() dto: RefundPaymentDto,
  ): Promise<PaymentDetailResponseDTO> {
    return this.apiService.refundPayment(
      param.id,
      dto,
    ) as unknown as Promise<PaymentDetailResponseDTO>;
  }

  // --- MÉTODOS DE PAGO ---

  @Post('methods')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatePaymentMethod()
  async createMethod(
    @Body() dto: CreatePaymentMethodRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<PaymentMethodDetailResponseDTO> {
    return this.apiService.createPaymentMethod(
      req.user.id,
      dto,
    ) as unknown as Promise<PaymentMethodDetailResponseDTO>;
  }

  @Put('methods/:id')
  @ApiUpdatePaymentMethod()
  async updateMethod(
    @Param() param: PaymentMethodIdParamDTO,
    @Body() dto: UpdatePaymentMethodDto,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<PaymentMethodDetailResponseDTO> {
    return this.apiService.updatePaymentMethod(
      param.id,
      req.user.id,
      dto,
    ) as unknown as Promise<PaymentMethodDetailResponseDTO>;
  }

  @Delete('methods/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeletePaymentMethod()
  async deleteMethod(
    @Param() param: PaymentMethodIdParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<void> {
    return this.apiService.deletePaymentMethod(param.id, req.user.id);
  }

  // --- WEBHOOKS ---

  @Post('webhooks/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiHandleWebhook()
  async handleWebhooks(
    @Param() param: PaymentWebhookParamDTO,
    @Body() payload: Record<string, unknown>,
  ): Promise<void> {
    return this.apiService.processWebhook(param.provider, payload);
  }
}
