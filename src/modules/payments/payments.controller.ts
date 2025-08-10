import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Payment } from './entities/payment.entity';
import { PaymentMethodEntity } from './entities/payment-method.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import {
  PaymentSummaryDto,
  PaymentTrendsDto,
  ProfessionalPaymentStatsDto,
  UserPaymentStatsDto,
} from './dto/payment-stats.dto';

@ApiTags('Payments - Sistema de Pagos')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ==================== PAGOS ====================

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo pago' })
  @ApiResponse({ status: 201, description: 'Pago creado exitosamente', type: Payment })
  @ApiResponse({ status: 400, description: 'Datos de pago inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async createPayment(@Request() req, @Body() createPaymentDto: CreatePaymentDto): Promise<Payment> {
    return this.paymentsService.createPayment(req.user.id, createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los pagos del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de pagos obtenida exitosamente', type: [Payment] })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'] })
  @ApiQuery({ name: 'professionalId', required: false, description: 'Filtrar por profesional' })
  async findAllPayments(
    @Request() req,
    @Query('status') status?: string,
    @Query('professionalId') professionalId?: string,
  ): Promise<Payment[]> {
    return this.paymentsService.findAllPayments(req.user.id, professionalId, status as any);
  }

  @Get('professional/:professionalId')
  @ApiOperation({ summary: 'Obtener pagos de un profesional específico' })
  @ApiResponse({ status: 200, description: 'Lista de pagos obtenida exitosamente', type: [Payment] })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'] })
  async findPaymentsByProfessional(
    @Param('professionalId') professionalId: string,
    @Query('status') status?: string,
  ): Promise<Payment[]> {
    return this.paymentsService.findAllPayments(undefined, professionalId, status as any);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pago por ID' })
  @ApiResponse({ status: 200, description: 'Pago obtenido exitosamente', type: Payment })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async findPaymentById(@Param('id') id: string): Promise<Payment> {
    return this.paymentsService.findPaymentById(id);
  }

  @Get('transaction/:transactionId')
  @ApiOperation({ summary: 'Obtener un pago por ID de transacción' })
  @ApiResponse({ status: 200, description: 'Pago obtenido exitosamente', type: Payment })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async findPaymentByTransactionId(@Param('transactionId') transactionId: string): Promise<Payment> {
    return this.paymentsService.findPaymentByTransactionId(transactionId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un pago' })
  @ApiResponse({ status: 200, description: 'Pago actualizado exitosamente', type: Payment })
  @ApiResponse({ status: 400, description: 'No se puede actualizar este pago' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async updatePayment(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    return this.paymentsService.updatePayment(id, updatePaymentDto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar un pago' })
  @ApiResponse({ status: 200, description: 'Pago cancelado exitosamente', type: Payment })
  @ApiResponse({ status: 400, description: 'No se puede cancelar este pago' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para cancelar este pago' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async cancelPayment(@Param('id') id: string, @Request() req): Promise<Payment> {
    return this.paymentsService.cancelPayment(id, req.user.id);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Reembolsar un pago' })
  @ApiResponse({ status: 200, description: 'Reembolso procesado exitosamente', type: Payment })
  @ApiResponse({ status: 400, description: 'No se puede reembolsar este pago' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async refundPayment(
    @Param('id') id: string,
    @Body() refundDto: RefundPaymentDto,
    @Request() req,
  ): Promise<Payment> {
    return this.paymentsService.refundPayment(id, refundDto, req.user.id);
  }

  // ==================== MÉTODOS DE PAGO ====================

  @Post('methods')
  @ApiOperation({ summary: 'Crear un nuevo método de pago' })
  @ApiResponse({ status: 201, description: 'Método de pago creado exitosamente', type: PaymentMethodEntity })
  @ApiResponse({ status: 400, description: 'Datos del método de pago inválidos' })
  async createPaymentMethod(
    @Request() req,
    @Body() createPaymentMethodDto: CreatePaymentMethodDto,
  ): Promise<PaymentMethodEntity> {
    return this.paymentsService.createPaymentMethod(req.user.id, createPaymentMethodDto);
  }

  @Get('methods')
  @ApiOperation({ summary: 'Obtener todos los métodos de pago del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de métodos de pago obtenida exitosamente', type: [PaymentMethodEntity] })
  async findAllPaymentMethods(@Request() req): Promise<PaymentMethodEntity[]> {
    return this.paymentsService.findAllPaymentMethods(req.user.id);
  }

  @Get('methods/:id')
  @ApiOperation({ summary: 'Obtener un método de pago por ID' })
  @ApiResponse({ status: 200, description: 'Método de pago obtenido exitosamente', type: PaymentMethodEntity })
  @ApiResponse({ status: 404, description: 'Método de pago no encontrado' })
  async findPaymentMethodById(@Param('id') id: string, @Request() req): Promise<PaymentMethodEntity> {
    return this.paymentsService.findPaymentMethodById(id, req.user.id);
  }

  @Patch('methods/:id')
  @ApiOperation({ summary: 'Actualizar un método de pago' })
  @ApiResponse({ status: 200, description: 'Método de pago actualizado exitosamente', type: PaymentMethodEntity })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Método de pago no encontrado' })
  async updatePaymentMethod(
    @Param('id') id: string,
    @Request() req,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodEntity> {
    return this.paymentsService.updatePaymentMethod(id, req.user.id, updatePaymentMethodDto);
  }

  @Delete('methods/:id')
  @ApiOperation({ summary: 'Eliminar un método de pago' })
  @ApiResponse({ status: 200, description: 'Método de pago eliminado exitosamente' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar este método de pago' })
  @ApiResponse({ status: 404, description: 'Método de pago no encontrado' })
  @HttpCode(HttpStatus.OK)
  async deletePaymentMethod(@Param('id') id: string, @Request() req): Promise<void> {
    return this.paymentsService.deletePaymentMethod(id, req.user.id);
  }

  @Post('methods/:id/default')
  @ApiOperation({ summary: 'Establecer un método de pago como predeterminado' })
  @ApiResponse({ status: 200, description: 'Método de pago establecido como predeterminado exitosamente', type: PaymentMethodEntity })
  @ApiResponse({ status: 404, description: 'Método de pago no encontrado' })
  async setDefaultPaymentMethod(@Param('id') id: string, @Request() req): Promise<PaymentMethodEntity> {
    return this.paymentsService.setDefaultPaymentMethod(id, req.user.id);
  }

  // ==================== TRANSACCIONES ====================

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Obtener todas las transacciones de un pago' })
  @ApiResponse({ status: 200, description: 'Lista de transacciones obtenida exitosamente', type: [PaymentTransaction] })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async findTransactionsByPaymentId(@Param('id') paymentId: string): Promise<PaymentTransaction[]> {
    return this.paymentsService.findTransactionsByPaymentId(paymentId);
  }

  // ==================== ESTADÍSTICAS ====================

  @Get('stats/summary')
  @ApiOperation({ summary: 'Obtener resumen de pagos del usuario' })
  @ApiResponse({ status: 200, description: 'Resumen de pagos obtenido exitosamente', type: PaymentSummaryDto })
  @ApiQuery({ name: 'professionalId', required: false, description: 'Filtrar por profesional' })
  async getPaymentSummary(
    @Request() req,
    @Query('professionalId') professionalId?: string,
  ): Promise<PaymentSummaryDto> {
    return this.paymentsService.getPaymentSummary(req.user.id, professionalId);
  }

  @Get('stats/trends')
  @ApiOperation({ summary: 'Obtener tendencias de pagos del usuario' })
  @ApiResponse({ status: 200, description: 'Tendencias de pagos obtenidas exitosamente', type: [PaymentTrendsDto] })
  @ApiQuery({ name: 'days', required: false, description: 'Número de días (por defecto 30)', type: Number })
  async getPaymentTrends(
    @Request() req,
    @Query('days') days: number = 30,
  ): Promise<PaymentTrendsDto[]> {
    return this.paymentsService.getPaymentTrends(days, req.user.id);
  }

  @Get('stats/professional/:professionalId')
  @ApiOperation({ summary: 'Obtener estadísticas de pagos de un profesional' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente', type: ProfessionalPaymentStatsDto })
  @ApiResponse({ status: 404, description: 'Profesional no encontrado' })
  async getProfessionalPaymentStats(@Param('professionalId') professionalId: string): Promise<ProfessionalPaymentStatsDto> {
    // Implementar lógica para obtener estadísticas del profesional
    return this.paymentsService.getPaymentSummary(undefined, professionalId);
  }

  @Get('stats/user/:userId')
  @ApiOperation({ summary: 'Obtener estadísticas de pagos de un usuario' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente', type: UserPaymentStatsDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getUserPaymentStats(@Param('userId') userId: string): Promise<UserPaymentStatsDto> {
    // Implementar lógica para obtener estadísticas del usuario
    return this.paymentsService.getPaymentSummary(userId);
  }

  // ==================== WEBHOOKS ====================

  @Post('webhooks/:provider')
  @ApiOperation({ summary: 'Webhook para proveedores de pagos' })
  @ApiResponse({ status: 200, description: 'Webhook procesado exitosamente' })
  @ApiResponse({ status: 400, description: 'Webhook inválido' })
  @HttpCode(HttpStatus.OK)
  async processWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Request() req,
  ): Promise<void> {
    const signature = req.headers['stripe-signature'] || req.headers['paypal-signature'];
    await this.paymentsService.processWebhook(provider as any, payload, signature);
  }
}
