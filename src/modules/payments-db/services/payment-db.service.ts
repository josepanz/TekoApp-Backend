// src/modules/payments/services/payment-db.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaDatasource } from '@core/database/services/prisma.service'; // Ajusta la ruta a tu PrismaService
import {
  Payments,
  PaymentMethod,
  PaymentTransaction,
  PaymentStatus,
  TransactionStatus,
  TransactionType,
  Prisma,
  PaymentMethodEntity,
} from '@prisma/client';

@Injectable()
export class PaymentDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  // ==================== PAGOS ====================

  async findExistingPayment(
    userId: number,
    serviceRequestId: string,
  ): Promise<Payments | null> {
    return this.prisma.extended.payments.findFirst({
      where: { userId, serviceRequestId },
    });
  }

  async createPaymentWithTransaction(
    data: Omit<
      Prisma.PaymentsUncheckedCreateInput,
      'id' | 'createdAt' | 'updatedAt'
    >,
    transactionId: string,
  ): Promise<Payments> {
    // Usamos transacción ACID de Prisma para asegurar que el pago y su registro histórico se creen juntos
    return this.prisma.extended.$transaction(async (tx) => {
      const payment = await tx.payments.create({ data });

      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          type: TransactionType.PAYMENT,
          amount: payment.totalAmount,
          status: TransactionStatus.PENDING,
          externalTransactionId: transactionId,
        },
      });

      return payment;
    });
  }

  async findAllPayments(
    userId?: number,
    professionalId?: number,
    status?: PaymentStatus,
  ): Promise<Payments[]> {
    return this.prisma.extended.payments.findMany({
      where: {
        ...(userId && { userId }),
        ...(professionalId && { professionalId }),
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      include: { users: true, professionals: true, service: true },
    });
  }

  async findPaymentById(id: string): Promise<Payments | null> {
    return this.prisma.extended.payments.findUnique({
      where: { id },
    });
  }

  async updatePayment(
    id: string,
    data: Prisma.PaymentsUpdateInput,
  ): Promise<Payments> {
    return this.prisma.extended.payments.update({
      where: { id },
      data,
    });
  }

  // ==================== MÉTODOS DE PAGO ====================

  async clearDefaultPaymentMethods(userId: number): Promise<void> {
    await this.prisma.extended.paymentMethodEntity.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  async createPaymentMethod(
    data: Prisma.PaymentMethodEntityUncheckedCreateInput,
  ): Promise<PaymentMethodEntity> {
    return await this.prisma.extended.paymentMethodEntity.create({ data });
  }

  async findAllPaymentMethods(userId: number): Promise<PaymentMethodEntity[]> {
    return await this.prisma.extended.paymentMethodEntity.findMany({
      where: { userId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findPaymentMethodById(
    id: string,
    userId: number,
  ): Promise<PaymentMethodEntity | null> {
    return await this.prisma.extended.paymentMethodEntity.findFirst({
      where: { id, userId },
    });
  }

  async countActivePaymentMethods(userId: number): Promise<number> {
    return this.prisma.extended.paymentMethodEntity.count({
      where: { userId, isActive: true },
    });
  }

  async updatePaymentMethod(
    id: string,
    data: Prisma.PaymentMethodEntityUpdateInput,
  ): Promise<PaymentMethodEntity> {
    return await this.prisma.extended.paymentMethodEntity.update({
      where: { id },
      data,
    });
  }

  // ==================== TRANSACCIONES Y REEMBOLSOS ====================

  async executeRefund(
    paymentId: string,
    refundAmount: number,
    reason: string,
    isFullRefund: boolean,
    newTotalRefunded: number,
  ): Promise<Payments> {
    return this.prisma.extended.$transaction(async (tx) => {
      await tx.paymentTransaction.create({
        data: {
          payment: { connect: { id: paymentId } },
          type: TransactionType.REFUND,
          amount: refundAmount,
          status: TransactionStatus.PROCESSING,
          description: `Reembolso: ${reason}`,
          externalTransactionId: `refund-${paymentId}-${Date.now()}`,
        },
      });

      return tx.payments.update({
        where: { id: paymentId },
        data: {
          status: isFullRefund
            ? PaymentStatus.REFUNDED
            : PaymentStatus.PARTIAL_REFUNDED,
          refundDetails: {
            refundedAmount: newTotalRefunded,
            refundReason: reason,
            refundedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
    });
  }

  async findTransactionByExternalId(
    externalTransactionId: string,
  ): Promise<PaymentTransaction | null> {
    return this.prisma.extended.paymentTransaction.findUnique({
      where: { externalTransactionId },
    });
  }

  async updateTransactionAndPaymentStatus(
    transactionId: string,
    paymentId: string,
    tStatus: TransactionStatus,
    pStatus: PaymentStatus,
    failureReason?: string,
  ): Promise<void> {
    await this.prisma.extended.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status: tStatus,
          processedAt:
            tStatus === TransactionStatus.COMPLETED ? new Date() : undefined,
          failedAt:
            tStatus === TransactionStatus.FAILED ? new Date() : undefined,
          failureReason,
        },
      });

      await tx.payments.update({
        where: { id: paymentId },
        data: {
          status: pStatus,
          processedAt:
            pStatus === PaymentStatus.COMPLETED ? new Date() : undefined,
          failedAt: pStatus === PaymentStatus.FAILED ? new Date() : undefined,
          failureReason,
        },
      });
    });
  }

  // ==================== ESTADÍSTICAS ====================

  async getPaymentSummary(userId?: number, professionalId?: number) {
    const whereClause: Prisma.PaymentsWhereInput = {
      ...(userId && { userId }),
      ...(professionalId && { professionalId }),
    };

    const [totalStats, completedStats, failedStats] = await Promise.all([
      this.prisma.extended.payments.aggregate({
        where: whereClause,
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.extended.payments.count({
        where: { ...whereClause, status: PaymentStatus.COMPLETED },
      }),
      this.prisma.extended.payments.count({
        where: { ...whereClause, status: PaymentStatus.FAILED },
      }),
    ]);

    return {
      totalPayments: totalStats._count.id,
      totalAmount: Number(totalStats._sum.totalAmount || 0),
      successfulPayments: completedStats,
      failedPayments: failedStats,
    };
  }

  async getPaymentTrends(days: number, userId?: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // En Prisma, los agrupamientos por fecha (DATE) requieren $queryRaw
    // Adaptado de forma segura contra inyecciones SQL
    const trends = await this.prisma.extended.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*)::int as "totalPayments",
        COALESCE(SUM("totalAmount"), 0)::float as "totalAmount",
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int as "successfulPayments",
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END)::int as "failedPayments"
      FROM "Payment"
      WHERE "createdAt" >= ${startDate}
      ${userId ? Prisma.sql`AND "userId" = ${userId}` : Prisma.empty}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;
    return trends;
  }
}
