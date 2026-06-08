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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { PaymentApiService } from './payments.service';
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
} from './dtos/request';

@ApiTags('Pagos')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly apiService: PaymentApiService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo pago' })
  @ApiResponse({ status: 201, description: 'Pago creado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Ya existe un pago para esta solicitud',
  })
  async create(
    @Body() dto: CreatePaymentDto,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.apiService.createPayment(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de pagos con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de pagos obtenida' })
  async findAll(@Query() query: PaymentListQueryDTO) {
    return this.apiService.getPayments(
      query.userId,
      query.professionalId,
      query.status,
    );
  }

  @Get('summary')
  @ApiOperation({ summary: 'Obtener resumen de métricas de pagos' })
  @ApiResponse({ status: 200, description: 'Resumen obtenido' })
  async getSummary(@Query() query: PaymentSummaryQueryDTO) {
    return this.apiService.getMetricsSummary(
      query.userId,
      query.professionalId,
    );
  }

  @Get('trends')
  @ApiOperation({ summary: 'Obtener tendencias de pagos' })
  @ApiResponse({ status: 200, description: 'Tendencias obtenidas' })
  async getTrends(@Query() query: PaymentTrendsQueryDTO) {
    return this.apiService.getMetricsTrends(query.days, query.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pago por ID' })
  @ApiResponse({ status: 200, description: 'Pago encontrado' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async findOne(@Param() param: PaymentIdParamDTO) {
    return this.apiService.getPaymentById(param.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un pago' })
  @ApiResponse({ status: 200, description: 'Pago actualizado' })
  @ApiResponse({
    status: 400,
    description: 'Solo se pueden actualizar pagos pendientes',
  })
  async update(
    @Param() param: PaymentIdParamDTO,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.apiService.updatePayment(param.id, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar un pago' })
  @ApiResponse({ status: 200, description: 'Pago cancelado' })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos para cancelar este pago',
  })
  async cancel(
    @Param() param: PaymentIdParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.apiService.cancelPayment(param.id, req.user.id);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reembolsar un pago' })
  @ApiResponse({ status: 200, description: 'Reembolso procesado' })
  @ApiResponse({
    status: 400,
    description: 'El monto del reembolso excede el disponible',
  })
  async refund(
    @Param() param: PaymentIdParamDTO,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.apiService.refundPayment(param.id, dto);
  }

  // --- MÉTODOS DE PAGO ---

  @Post('methods')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un método de pago' })
  @ApiResponse({ status: 201, description: 'Método de pago creado' })
  async createMethod(
    @Body() dto: CreatePaymentMethodRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.apiService.createPaymentMethod(req.user.id, dto);
  }

  @Put('methods/:id')
  @ApiOperation({ summary: 'Actualizar un método de pago' })
  @ApiResponse({ status: 200, description: 'Método de pago actualizado' })
  @ApiResponse({ status: 404, description: 'Método de pago no encontrado' })
  async updateMethod(
    @Param() param: PaymentMethodIdParamDTO,
    @Body() dto: UpdatePaymentMethodDto,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.apiService.updatePaymentMethod(param.id, req.user.id, dto);
  }

  @Delete('methods/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un método de pago' })
  @ApiResponse({ status: 204, description: 'Método de pago eliminado' })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar el único método de pago',
  })
  async deleteMethod(
    @Param() param: PaymentMethodIdParamDTO,
    @Request() req: { user: IUserDataOnJwt },
  ) {
    return this.apiService.deletePaymentMethod(param.id, req.user.id);
  }

  // --- WEBHOOKS ---

  @Post('webhooks/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recibir webhook de proveedor de pagos' })
  @ApiResponse({ status: 200, description: 'Webhook procesado' })
  async handleWebhooks(
    @Param() param: PaymentWebhookParamDTO,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.apiService.processWebhook(param.provider, payload);
  }
}
