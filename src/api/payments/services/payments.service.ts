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
import { TaxService } from '@api/tax/services/tax.service';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { PaymentStatus, Prisma } from '@prisma/client';
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

import { t } from '@common/i18n/i18n.helper';
@Injectable()
export class PaymentApiService {
  constructor(
    private readonly dbService: PaymentDbService,
    private readonly feeCalculator: FeeCalculatorService,
    private readonly taxService: TaxService,
  ) {}

  // ==================== PAGOS ====================

  /**
   * Resuelve el UUID público del pago (recibido en la URL) a la entidad completa con su PK interna
   * (Int). Lanza NotFound si no existe. El id numérico nunca se expone en la respuesta.
   */
  private async getPaymentEntityByRef(referenceId: string) {
    const payment = await this.dbService.findPaymentByReferenceId(referenceId);
    if (!payment) throw new NotFoundException(t('payments.NOT_FOUND'));
    return payment;
  }

  async createPayment(
    userId: number,
    dto: CreatePaymentDto,
  ): Promise<PaymentDetailResponseDTO> {
    const service = await this.dbService.findServiceByReferenceId(
      dto.serviceId,
    );
    if (!service) throw new NotFoundException(t('payments.SERVICE_NOT_FOUND'));

    const professional = await this.dbService.findProfessionalByReferenceId(
      dto.professionalId,
    );
    if (!professional) {
      throw new NotFoundException(t('payments.PROFESSIONAL_NOT_FOUND'));
    }

    const existingPayment = await this.dbService.findExistingPayment(
      userId,
      service.id,
    );
    if (existingPayment) {
      throw new BadRequestException(t('payments.ALREADY_EXISTS_FOR_SERVICE'));
    }

    const fee = await this.feeCalculator.calculateProviderFee(
      dto.amount,
      dto.paymentProvider,
    );
    // `platformFee` es la comisión de la plataforma (antes se guardaba, mal nombrada, en el campo
    // `tax`) — `tax` ahora es el IVA real (`TaxService`), deshabilitado por default hasta contar
    // con una tasa real de asesoría fiscal (ver openspec/decisions.md, Fase 0011).
    const platformFee = await this.feeCalculator.calculatePlatformFee(
      dto.amount + fee,
    );
    const tax = await this.taxService.calculateTax(platformFee);
    const totalAmount = dto.amount + fee + platformFee + tax;

    const transactionId = uuidv4();

    const payment = await this.dbService.createPaymentWithTransaction(
      {
        userId,
        professionalId: professional.id,
        serviceId: service.id,
        currencyCode: dto.currencyCode,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        paymentProvider: dto.paymentProvider,
        fee,
        tax,
        platformFee,
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

  /**
   * Variante de `getPaymentById` para el endpoint expuesto a cualquier usuario autenticado
   * (`GET /payments/:id`) — a diferencia de `getPaymentById` (usado internamente por
   * cancel/refund/update, ya validados por sus propios checks o por ser admin-only), acá hay que
   * verificar que quien pide el pago sea su dueño (`Payments.userId`) o tenga
   * `payments.audit:read`/`admin:all` — sin esto, cualquier usuario logueado podía leer el detalle
   * financiero de un pago ajeno solo conociendo su `referenceId`.
   */
  async getPaymentByIdForViewer(
    id: string,
    user: IUserDataOnJwt,
  ): Promise<PaymentDetailResponseDTO> {
    const payment = await this.getPaymentEntityByRef(id);
    const isPrivileged =
      user.permissions.includes(PERMISSIONS.PAYMENTS.AUDIT_VIEW) ||
      user.permissions.includes(PERMISSIONS.ADMIN.ALL);
    if (!isPrivileged && payment.userId !== user.id) {
      throw new ForbiddenException(t('payments.UNAUTHORIZED_VIEW'));
    }
    return mapPaymentToResponse(payment);
  }

  async updatePayment(
    id: string,
    dto: UpdatePaymentDto,
  ): Promise<PaymentDetailResponseDTO> {
    const payment = await this.getPaymentEntityByRef(id);
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(t('payments.ONLY_PENDING_CAN_BE_UPDATED'));
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
      throw new ForbiddenException(t('payments.UNAUTHORIZED_CANCEL'));
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(t('payments.CANNOT_BE_CANCELLED'));
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
      throw new ConflictException(t('payments.STATUS_CHANGED_BEFORE_CANCEL'));
    }
    return this.getPaymentById(id);
  }

  async refundPayment(
    id: string,
    dto: RefundPaymentDto,
    userId: number,
  ): Promise<PaymentDetailResponseDTO> {
    // 404 rápido si el pago no existe. La validación real de estado/monto disponible se hace
    // de forma atómica dentro de executeRefund (bajo lock de fila), no acá — un chequeo previo
    // sin lock sería una condición de carrera si dos reembolsos llegan al mismo tiempo.
    const payment = await this.getPaymentEntityByRef(id);
    if (payment.userId !== userId) {
      throw new ForbiddenException(t('payments.UNAUTHORIZED_REFUND'));
    }
    await this.dbService.executeRefund(payment.id, dto.amount, dto.reason);
    return this.getPaymentById(id);
  }

  // ==================== MÉTODOS DE PAGO ====================

  async getPaymentMethods(
    userId: number,
  ): Promise<PaymentMethodDetailResponseDTO[]> {
    const methods = await this.dbService.findAllPaymentMethods(userId);
    return methods.map((method) => mapPaymentMethodToResponse(method));
  }

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
    if (!method) throw new NotFoundException(t('payments.METHOD_NOT_FOUND'));

    const updated = dto.isDefault
      ? await this.dbService.setPaymentMethodAsDefault(
          method.id,
          userId,
          dto as unknown,
        )
      : await this.dbService.updatePaymentMethod(method.id, dto as unknown);
    return mapPaymentMethodToResponse(updated);
  }

  async deletePaymentMethod(id: string, userId: number): Promise<void> {
    const method = await this.dbService.findPaymentMethodByReferenceId(
      id,
      userId,
    );
    if (!method) throw new NotFoundException(t('payments.METHOD_NOT_FOUND'));

    const deactivated = await this.dbService.deactivatePaymentMethodIfNotLast(
      method.id,
      userId,
    );
    if (!deactivated) {
      throw new BadRequestException(t('payments.CANNOT_DELETE_ONLY_METHOD'));
    }
  }

  // ==================== WEBHOOKS ====================
  //
  // REMOVIDO 2026-09-04 (auditoría de plataforma, Fase A — ver
  // openspec/specs/platform-audit-2026-09.md §2.1).
  //
  // Existía `POST /payments/webhooks/:provider` con un handler de Stripe. Tenía dos problemas:
  //
  //  1. Seguridad: el endpoint tomaba un `externalId` arbitrario del body y flipeaba el estado
  //     del pago/transacción correspondiente, protegido ÚNICAMENTE por `JwtAuthGuard` — que exige
  //     un JWT válido, no un permiso. Cualquier usuario logueado podía marcar cualquier pago como
  //     COMPLETED. Nunca verificó firma: `stripe.webhooks.constructEvent()` no se llamaba en
  //     ningún lado, pese a que `STRIPE_WEBHOOK_SECRET` es `required` en `config-schema.ts`.
  //  2. No servía a nadie: el SDK de Stripe está en `package.json` pero no se importa en todo
  //     `src/` — los pagos son internos/simulados. Ningún cliente (Web ni Mobile) llamaba la ruta.
  //
  // No se re-implementó la verificación de firma de Stripe porque la pasarela definida para
  // Paraguay es **Dinelco Checkout (BEPSA)**, cuyo contrato de callback es distinto. Ver
  // `openspec/changes/0014-dinelco-checkout-integration.md`: ahí va el webhook nuevo, con la
  // verificación de autenticidad que exija Dinelco, como ruta pública explícita y no bajo el
  // guard de sesión.
  //
  // `PaymentDbService.findTransactionByExternalId` se mantiene: es un primitivo genérico, ya
  // testeado, que la integración de Dinelco va a necesitar igual.

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
