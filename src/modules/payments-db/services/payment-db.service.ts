// src/modules/payments/services/payment-db.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaDatasource } from '@core/database/services/prisma.service'; // Ajusta la ruta a tu PrismaService
import {
  Payments,
  PaymentTransaction,
  PaymentStatus,
  TransactionStatus,
  TransactionType,
  Prisma,
  PaymentMethodEntity,
} from '@prisma/client';

// Include que trae el referenceId (UUID público) del servicio para exponerlo en las respuestas
// de pagos sin filtrar la PK interna (Int).
const serviceRefInclude = {
  service: { select: { referenceId: true } },
} satisfies Prisma.PaymentsInclude;

@Injectable()
export class PaymentDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  // ==================== RESOLUCIÓN DE REFERENCIAS ====================

  /** Resuelve el UUID público de un servicio a su PK interna (Int), o null si no existe. */
  async findServiceByReferenceId(
    referenceId: string,
  ): Promise<{ id: number } | null> {
    return this.prisma.extended.services.findUnique({
      where: { referenceId },
      select: { id: true },
    });
  }

  // ==================== PAGOS ====================

  async findExistingPayment(
    userId: number,
    serviceId: number,
  ): Promise<Payments | null> {
    return this.prisma.extended.payments.findFirst({
      where: { userId, serviceId },
    });
  }

  async createPaymentWithTransaction(
    data: Omit<
      Prisma.PaymentsUncheckedCreateInput,
      'id' | 'referenceId' | 'createdAt' | 'updatedAt'
    >,
    transactionId: string,
  ) {
    // Usamos transacción ACID de Prisma para asegurar que el pago y su registro histórico se creen juntos
    return this.prisma.extended.$transaction(async (tx) => {
      const payment = await tx.payments.create({
        data,
        include: serviceRefInclude,
      });

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
  ) {
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

  /** Busca un pago por su PK interna (Int). Uso interno tras resolver el referenceId. */
  async findPaymentById(id: number) {
    return this.prisma.extended.payments.findUnique({
      where: { id },
      include: serviceRefInclude,
    });
  }

  /** Busca un pago por su referenceId (UUID público recibido en la URL). */
  async findPaymentByReferenceId(referenceId: string) {
    return this.prisma.extended.payments.findUnique({
      where: { referenceId },
      include: serviceRefInclude,
    });
  }

  async updatePayment(id: number, data: Prisma.PaymentsUpdateInput) {
    return this.prisma.extended.payments.update({
      where: { id },
      data,
      include: serviceRefInclude,
    });
  }

  /**
   * Actualiza el pago solo si su estado actual está entre `expectedStatuses` — evita
   * condiciones de carrera entre dos escrituras concurrentes (ej. cancelar + webhook de
   * confirmación corriendo al mismo tiempo). Devuelve la cantidad de filas afectadas: 0
   * significa que el estado cambió entre la lectura de validación y esta escritura.
   */
  async updatePaymentConditional(
    id: number,
    expectedStatuses: PaymentStatus[],
    data: Prisma.PaymentsUpdateInput,
  ): Promise<number> {
    const result = await this.prisma.extended.payments.updateMany({
      where: { id, status: { in: expectedStatuses } },
      data,
    });
    return result.count;
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

  /** Busca un método de pago por su referenceId (UUID) validando pertenencia al usuario. */
  async findPaymentMethodByReferenceId(
    referenceId: string,
    userId: number,
  ): Promise<PaymentMethodEntity | null> {
    return await this.prisma.extended.paymentMethodEntity.findFirst({
      where: { referenceId, userId },
    });
  }

  async countActivePaymentMethods(userId: number): Promise<number> {
    return this.prisma.extended.paymentMethodEntity.count({
      where: { userId, isActive: true },
    });
  }

  async updatePaymentMethod(
    id: number,
    data: Prisma.PaymentMethodEntityUpdateInput,
  ): Promise<PaymentMethodEntity> {
    return await this.prisma.extended.paymentMethodEntity.update({
      where: { id },
      data,
    });
  }

  // ==================== TRANSACCIONES Y REEMBOLSOS ====================

  /**
   * Reembolsa un pago de forma atómica: bloquea la fila (`SELECT ... FOR UPDATE`) antes de
   * validar estado/monto disponible y escribir, dentro de la MISMA transacción. Sin este lock,
   * dos reembolsos concurrentes sobre el mismo pago pueden leer el mismo `refundedAmount`
   * acumulado antes de que ninguno escriba, y el segundo en confirmar pisa (no suma) el
   * resultado del primero — riesgo real de doble reembolso o de perder el registro de uno de
   * los dos. Mantiene el mismo comportamiento que antes (solo pagos COMPLETED son reembolsables)
   * — la única diferencia es que ahora es seguro bajo concurrencia.
   *
   * `paymentId` es la PK interna (Int) ya resuelta en la capa API; el `SELECT ... FOR UPDATE`
   * usa el valor directamente (sin cast `::uuid`, que rompería contra una columna integer).
   */
  async executeRefund(
    paymentId: number,
    refundAmount: number,
    reason: string,
  ): Promise<Payments> {
    return this.prisma.extended.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<
        {
          id: number;
          status: PaymentStatus;
          total_amount: Prisma.Decimal;
          refund_details: Prisma.JsonValue | null;
        }[]
      >`SELECT id, status, total_amount, refund_details FROM payments WHERE id = ${paymentId} FOR UPDATE`;
      const payment = locked[0];

      if (!payment) {
        throw new NotFoundException('Pago no encontrado');
      }
      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new BadRequestException(
          'Solo se pueden reembolsar pagos completados',
        );
      }

      const currentRefundDetails = payment.refund_details as Record<
        string,
        unknown
      > | null;
      const currentlyRefunded =
        typeof currentRefundDetails?.refundedAmount === 'number'
          ? currentRefundDetails.refundedAmount
          : 0;
      const totalAmountNum = Number(payment.total_amount);
      const availableToRefund = totalAmountNum - currentlyRefunded;

      if (refundAmount > availableToRefund) {
        throw new BadRequestException(
          'El monto del reembolso excede el monto disponible',
        );
      }

      const newTotalRefunded = currentlyRefunded + refundAmount;
      const isFullRefund = newTotalRefunded >= totalAmountNum;

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
    transactionId: number,
    paymentId: number,
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

    const [totalStats, completedStats, failedStats, pendingStats] =
      await Promise.all([
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
        this.prisma.extended.payments.count({
          where: { ...whereClause, status: PaymentStatus.PENDING },
        }),
      ]);

    return {
      totalPayments: totalStats._count.id,
      totalAmount: Number(totalStats._sum.totalAmount || 0),
      successfulPayments: completedStats,
      failedPayments: failedStats,
      pendingPayments: pendingStats,
    };
  }

  async getPaymentTrends(days: number, userId?: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // En Prisma, los agrupamientos por fecha (DATE) requieren $queryRaw
    // Adaptado de forma segura contra inyecciones SQL
    const trends = await this.prisma.extended.$queryRaw`
      SELECT
        DATE(created_at) as date,
        COUNT(*)::int as "totalPayments",
        COALESCE(SUM(total_amount), 0)::float as "totalAmount",
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int as "successfulPayments",
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END)::int as "failedPayments"
      FROM payments
      WHERE created_at >= ${startDate}
      ${userId ? Prisma.sql`AND user_id = ${userId}` : Prisma.empty}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    return trends;
  }
}
