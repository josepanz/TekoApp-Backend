// src/api/payments/services/payment-api.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PaymentDbService } from '@modules/payments-db/services/payment-db.service';
import {
  PaymentProvider,
  PaymentStatus,
  TransactionStatus,
  PaymentMethodEntity,
  Prisma,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  RefundPaymentDto,
  UpdatePaymentMethodDto,
} from '@/api/payments/dtos/request';

@Injectable()
export class PaymentApiService {
  constructor(private readonly dbService: PaymentDbService) {}

  // ==================== PAGOS ====================

  async createPayment(userId: number, dto: CreatePaymentDto) {
    const existingPayment = await this.dbService.findExistingPayment(
      userId,
      dto.serviceRequestId,
    );
    if (existingPayment) {
      throw new BadRequestException(
        'Ya existe un pago para esta solicitud de servicio',
      );
    }

    const fee = this.calculateFee(dto.amount, dto.paymentProvider);
    const tax = this.calculateTax(dto.amount + fee);
    const totalAmount = dto.amount + fee + tax;

    const transactionId = uuidv4();

    return this.dbService.createPaymentWithTransaction(
      {
        userId,
        professionalId: Number(dto.professionalId),
        serviceRequestId: dto.serviceRequestId,
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
  }

  async getPayments(
    userId?: number | string,
    professionalId?: number | string,
    status?: PaymentStatus,
  ) {
    return this.dbService.findAllPayments(
      userId !== undefined ? Number(userId) : undefined,
      professionalId !== undefined ? Number(professionalId) : undefined,
      status,
    );
  }

  async getPaymentById(id: string) {
    const payment = await this.dbService.findPaymentById(id);
    if (!payment) throw new NotFoundException('Pago no encontrado');
    return payment;
  }

  async updatePayment(id: string, dto: UpdatePaymentDto) {
    const payment = await this.getPaymentById(id);
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        'Solo se pueden actualizar pagos pendientes',
      );
    }
    return this.dbService.updatePayment(id, dto as unknown);
  }

  async cancelPayment(id: string, userId: number | string) {
    const numId = Number(userId);
    const payment = await this.getPaymentById(id);
    if (payment.userId !== numId) {
      throw new ForbiddenException(
        'No tienes permisos para cancelar este pago',
      );
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Este pago no puede ser cancelado');
    }
    return this.dbService.updatePayment(id, {
      status: PaymentStatus.CANCELLED,
    });
  }

  async refundPayment(id: string, dto: RefundPaymentDto) {
    const payment = await this.getPaymentById(id);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        'Solo se pueden reembolsar pagos completados',
      );
    }

    // Parseo seguro del JSON de prisma
    const currentRefundDetails = payment.refundDetails as Record<
      string,
      unknown
    > | null;
    const currentlyRefunded =
      typeof currentRefundDetails?.refundedAmount === 'number'
        ? currentRefundDetails.refundedAmount
        : 0;

    const availableToRefund = Number(payment.totalAmount) - currentlyRefunded;

    if (dto.amount > availableToRefund) {
      throw new BadRequestException(
        'El monto del reembolso excede el monto disponible',
      );
    }

    const newTotalRefunded = currentlyRefunded + dto.amount;
    const isFullRefund = newTotalRefunded >= Number(payment.totalAmount);

    return this.dbService.executeRefund(
      payment.id,
      dto.amount,
      dto.reason,
      isFullRefund,
      newTotalRefunded,
    );
  }

  // ==================== MÉTODOS DE PAGO ====================

  async createPaymentMethod(
    userId: number | string,
    dto: CreatePaymentDto,
  ): Promise<PaymentMethodEntity> {
    const numId = Number(userId);
    return this.dbService.createPaymentMethod({
      userId: numId,
      name:
        ((dto as unknown as Record<string, unknown>).name as string) ??
        'default',
      type: dto.paymentMethod,
      provider: dto.paymentProvider,
    } as unknown as Prisma.PaymentMethodEntityUncheckedCreateInput);
  }

  async updatePaymentMethod(
    id: string,
    userId: number | string,
    dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodEntity> {
    const numId = Number(userId);
    const method = await this.dbService.findPaymentMethodById(id, numId);
    if (!method) throw new NotFoundException('Método de pago no encontrado');

    if ((dto as unknown as Record<string, unknown>).isDefault) {
      await this.dbService.clearDefaultPaymentMethods(numId);
    }
    return this.dbService.updatePaymentMethod(id, dto as unknown);
  }

  async deletePaymentMethod(
    id: string,
    userId: number | string,
  ): Promise<void> {
    const numId = Number(userId);
    const method = await this.dbService.findPaymentMethodById(id, numId);
    if (!method) throw new NotFoundException('Método de pago no encontrado');

    const total = await this.dbService.countActivePaymentMethods(numId);
    if (total <= 1) {
      throw new BadRequestException(
        'No se puede eliminar el único método de pago',
      );
    }

    await this.dbService.updatePaymentMethod(id, {
      isActive: false,
    });
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
    userId?: number | string,
    professionalId?: number | string,
  ) {
    const raw = await this.dbService.getPaymentSummary(
      userId !== undefined ? Number(userId) : undefined,
      professionalId !== undefined ? Number(professionalId) : undefined,
    );

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

  async getMetricsTrends(days: number, userId?: number | string) {
    return this.dbService.getPaymentTrends(
      days,
      userId !== undefined ? Number(userId) : undefined,
    );
  }

  private calculateFee(amount: number, provider: PaymentProvider): number {
    const feeRates: Record<string, number> = {
      STRIPE: 0.029,
      PAYPAL: 0.029,
      MERCADOPAGO: 0.039,
      CASH: 0,
    };
    const rate = feeRates[provider] || 0.029;
    const fixedFee = provider === 'STRIPE' || provider === 'PAYPAL' ? 0.3 : 0;
    return Math.round((amount * rate + fixedFee) * 100) / 100;
  }

  private calculateTax(amount: number): number {
    return Math.round(amount * 0.21 * 100) / 100;
  }
}
