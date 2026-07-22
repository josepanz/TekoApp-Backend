// src/api/payments/services/payments.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PaymentDbService } from '@modules/payments-db/services/payment-db.service';
import { FeeCalculatorService } from '@modules/payments-db/services/fee-calculator.service';
import {
  PaymentProvider,
  PaymentStatus,
  TransactionStatus,
  Prisma,
} from '@prisma/client';
import { PaymentSummaryResponseDTO } from '../dtos/response/payment-summary.response.dto';
import { PaymentTrendsResponseDTO } from '../dtos/response/payment-trends.response.dto';
import {
  PaymentDetailResponseDTO,
  PaymentMethodDetailResponseDTO,
} from '../dtos/response';
import { v4 as uuidv4 } from 'uuid';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  RefundPaymentDto,
  UpdatePaymentMethodDto,
  CreatePaymentMethodRequestDTO,
} from '../dtos/request';
import {
  mapPaymentToResponse,
  mapPaymentsToResponse,
  mapPaymentMethodToResponse,
} from '../helpers/payments-response.helper';

@Injectable()
export class PaymentApiService {
  constructor(
    private readonly dbService: PaymentDbService,
    private readonly feeCalculator: FeeCalculatorService,
  ) {}

  // ==================== PAGOS ====================

  /**
   * Resuelve el UUID público del pago (recibido en la URL) a la entidad completa con su PK interna
   * (Int). Lanza NotFound si no existe. El id numérico nunca se expone en la respuesta.
   */
  private async getPaymentEntityByRef(referenceId: string) {
    const payment = await this.dbService.findPaymentByReferenceId(referenceId);
    if (!payment) throw new NotFoundException('Pago no encontrado');
    return payment;
  }

  async createPayment(
    userId: number,
    dto: CreatePaymentDto,
  ): Promise<PaymentDetailResponseDTO> {
    const service = await this.dbService.findServiceByReferenceId(
      dto.serviceId,
    );
    if (!service) throw new NotFoundException('Servicio no encontrado');

    const existingPayment = await this.dbService.findExistingPayment(
      userId,
      service.id,
    );
    if (existingPayment) {
      throw new BadRequestException('Ya existe un pago para este servicio');
    }

    const fee = await this.feeCalculator.calculateProviderFee(
      dto.amount,
      dto.paymentProvider,
    );
    const tax = await this.feeCalculator.calculatePlatformFee(dto.amount + fee);
    const totalAmount = dto.amount + fee + tax;

    const transactionId = uuidv4();

    const payment = await this.dbService.createPaymentWithTransaction(
      {
        userId,
        professionalId: Number(dto.professionalId),
        serviceId: service.id,
        currencyCode: dto.currencyCode,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        paymentProvider: dto.paymentProvider,
        fee,
        tax,
        totalAmount,
        transactionId,
        status: PaymentStatus.PENDING,
      },
      transactionId,
    );
    return mapPaymentToResponse(payment);
  }

  async getPayments(
    userId?: number,
    professionalId?: number,
    status?: PaymentStatus,
  ): Promise<PaymentDetailResponseDTO[]> {
    const payments = await this.dbService.findAllPayments(
      userId,
      professionalId,
      status,
    );
    return mapPaymentsToResponse(payments);
  }

  async getPaymentById(id: string): Promise<PaymentDetailResponseDTO> {
    const payment = await this.getPaymentEntityByRef(id);
    return mapPaymentToResponse(payment);
  }

  async updatePayment(
    id: string,
    dto: UpdatePaymentDto,
  ): Promise<PaymentDetailResponseDTO> {
    const payment = await this.getPaymentEntityByRef(id);
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        'Solo se pueden actualizar pagos pendientes',
      );
    }
    const updated = await this.dbService.updatePayment(
      payment.id,
      dto as unknown,
    );
    return mapPaymentToResponse(updated);
  }

  async cancelPayment(
    id: string,
    userId: number,
  ): Promise<PaymentDetailResponseDTO> {
    const payment = await this.getPaymentEntityByRef(id);
    if (payment.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para cancelar este pago',
      );
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Este pago no puede ser cancelado');
    }

    // updateMany + count en vez de update() incondicional: evita que dos escrituras
    // concurrentes (ej. esta cancelación y el webhook de confirmación) pisen el estado sin
    // detectar el conflicto — ver .claude/rules/typescript.md.
    const updatedCount = await this.dbService.updatePaymentConditional(
      payment.id,
      [PaymentStatus.PENDING],
      { status: PaymentStatus.CANCELLED },
    );
    if (updatedCount === 0) {
      throw new ConflictException(
        'El pago cambió de estado antes de poder cancelarlo',
      );
    }
    return this.getPaymentById(id);
  }

  async refundPayment(
    id: string,
    dto: RefundPaymentDto,
  ): Promise<PaymentDetailResponseDTO> {
    // 404 rápido si el pago no existe. La validación real de estado/monto disponible se hace
    // de forma atómica dentro de executeRefund (bajo lock de fila), no acá — un chequeo previo
    // sin lock sería una condición de carrera si dos reembolsos llegan al mismo tiempo.
    const payment = await this.getPaymentEntityByRef(id);
    await this.dbService.executeRefund(payment.id, dto.amount, dto.reason);
    return this.getPaymentById(id);
  }

  // ==================== MÉTODOS DE PAGO ====================

  async createPaymentMethod(
    userId: number,
    dto: CreatePaymentMethodRequestDTO,
  ): Promise<PaymentMethodDetailResponseDTO> {
    const created = await this.dbService.createPaymentMethod({
      userId,
      name: dto.name,
      type: dto.type,
      provider: dto.provider,
      isDefault: dto.isDefault ?? false,
      details: dto.details ?? {},
      externalId: dto.externalId,
    } as unknown as Prisma.PaymentMethodEntityUncheckedCreateInput);
    return mapPaymentMethodToResponse(created);
  }

  async updatePaymentMethod(
    id: string,
    userId: number,
    dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodDetailResponseDTO> {
    const method = await this.dbService.findPaymentMethodByReferenceId(
      id,
      userId,
    );
    if (!method) throw new NotFoundException('Método de pago no encontrado');

    if (dto.isDefault) {
      await this.dbService.clearDefaultPaymentMethods(userId);
    }
    const updated = await this.dbService.updatePaymentMethod(
      method.id,
      dto as unknown,
    );
    return mapPaymentMethodToResponse(updated);
  }

  async deletePaymentMethod(id: string, userId: number): Promise<void> {
    const method = await this.dbService.findPaymentMethodByReferenceId(
      id,
      userId,
    );
    if (!method) throw new NotFoundException('Método de pago no encontrado');

    const total = await this.dbService.countActivePaymentMethods(userId);
    if (total <= 1) {
      throw new BadRequestException(
        'No se puede eliminar el único método de pago',
      );
    }

    await this.dbService.updatePaymentMethod(method.id, { isActive: false });
  }

  // ==================== WEBHOOKS ====================

  async processWebhook(
    provider: PaymentProvider,
    payload: Record<string, unknown>,
  ): Promise<void> {
    switch (provider) {
      case PaymentProvider.STRIPE:
        await this.processStripeWebhook(payload);
        break;
      // Añadir PayPal, MercadoPago, etc.
      default:
        throw new BadRequestException('Proveedor de pagos no soportado');
    }
  }

  private async processStripeWebhook(
    payload: Record<string, unknown>,
  ): Promise<void> {
    const type = payload.type as string;
    const dataObj = payload.data as Record<string, Record<string, unknown>>;
    const target = dataObj?.object;

    if (!target || typeof target.id !== 'string') return;

    if (type === 'payment_intent.succeeded') {
      await this.handlePaymentResult(
        target.id,
        TransactionStatus.COMPLETED,
        PaymentStatus.COMPLETED,
      );
    } else if (type === 'payment_intent.payment_failed') {
      const error = target.last_payment_error as
        | Record<string, string>
        | undefined;
      await this.handlePaymentResult(
        target.id,
        TransactionStatus.FAILED,
        PaymentStatus.FAILED,
        error?.message || 'Pago fallido',
      );
    }
  }

  private async handlePaymentResult(
    externalId: string,
    tStatus: TransactionStatus,
    pStatus: PaymentStatus,
    reason?: string,
  ) {
    const transaction =
      await this.dbService.findTransactionByExternalId(externalId);
    if (transaction) {
      await this.dbService.updateTransactionAndPaymentStatus(
        transaction.id,
        transaction.paymentId,
        tStatus,
        pStatus,
        reason,
      );
    }
  }

  // ==================== ESTADÍSTICAS Y MATEMÁTICA ====================

  async getMetricsSummary(
    userId?: number,
    professionalId?: number,
  ): Promise<PaymentSummaryResponseDTO> {
    const raw = await this.dbService.getPaymentSummary(userId, professionalId);

    const successRate =
      raw.totalPayments > 0
        ? (raw.successfulPayments / raw.totalPayments) * 100
        : 0;
    const averageAmount =
      raw.totalPayments > 0 ? raw.totalAmount / raw.totalPayments : 0;

    return {
      ...raw,
      successRate: Math.round(successRate * 100) / 100,
      averageAmount: Math.round(averageAmount * 100) / 100,
    };
  }

  async getMetricsTrends(
    days: number,
    userId?: number,
  ): Promise<PaymentTrendsResponseDTO> {
    const trends = await this.dbService.getPaymentTrends(days, userId);
    return {
      trends: trends as PaymentTrendsResponseDTO['trends'],
      days,
    };
  }
}
