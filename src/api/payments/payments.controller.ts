// src/api/payments/controllers/payment.controller.ts
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
} from '@nestjs/common';
import { PaymentApiService } from './payments.service';
import { PaymentProvider } from '@prisma/client';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  RefundPaymentDto,
  UpdatePaymentMethodDto,
} from '@/api/payments/dtos/request';
import { PaymentQueryDto } from '@/api/payments/dtos/request/payment-query.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly apiService: PaymentApiService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePaymentDto) {
    // Usualmente se saca del JWT con @GetUser('id') userId: string
    return this.apiService.createPayment(1, dto);
  }

  @Get()
  async findAll(@Query() query: PaymentQueryDto) {
    return this.apiService.getPayments(
      query.userId,
      query.professionalId,
      query.status,
    );
  }

  @Get('summary')
  async getSummary(
    @Query('userId') userId?: string,
    @Query('professionalId') professionalId?: string,
  ) {
    return this.apiService.getMetricsSummary(userId, professionalId);
  }

  @Get('trends')
  async getTrends(@Query('days') days = 30, @Query('userId') userId?: string) {
    return this.apiService.getMetricsTrends(Number(days), userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.apiService.getPaymentById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.apiService.updatePayment(id, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string) {
    const mockUserId = 1;
    return this.apiService.cancelPayment(id, mockUserId);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  async refund(@Param('id') id: string, @Body() dto: RefundPaymentDto) {
    return this.apiService.refundPayment(id, dto);
  }

  // --- MÉTODOS DE PAGO ---

  @Post('methods')
  @HttpCode(HttpStatus.CREATED)
  async createMethod(@Body() dto: CreatePaymentDto) {
    const mockUserId = 1;
    return this.apiService.createPaymentMethod(mockUserId, dto);
  }

  @Put('methods/:id')
  async updateMethod(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    const mockUserId = 1;
    return this.apiService.updatePaymentMethod(id, mockUserId, dto);
  }

  @Delete('methods/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMethod(@Param('id') id: string) {
    const mockUserId = 1;
    return this.apiService.deletePaymentMethod(id, mockUserId);
  }

  // --- WEBHOOKS ---

  @Post('webhooks/:provider')
  @HttpCode(HttpStatus.OK)
  async handleWebhooks(
    @Param('provider') provider: PaymentProvider,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.apiService.processWebhook(provider, payload);
  }
}
