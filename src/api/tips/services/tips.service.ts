import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus, TipMode } from '@prisma/client';
import { TipsDbService } from '@modules/tips-db/services/tips-db.service';
import { PaymentDbService } from '@modules/payments-db/services/payment-db.service';
import { CreateTipRequestDTO } from '../dtos/request';
import { TipConfigResponseDTO, TipResponseDTO } from '../dtos/response';
import { mapTipToResponse } from '../helpers/tips-response.helper';

import { t } from '@common/i18n/i18n.helper';

// Solo se puede dejar propina una vez el pago del servicio se resolvió a favor — nunca sobre un
// pago pendiente/fallido/cancelado/reembolsado.
const ELIGIBLE_PAYMENT_STATUSES: PaymentStatus[] = [
  PaymentStatus.PAID,
  PaymentStatus.COMPLETED,
];

// Fallback cuando nunca se cargó ninguna fila de `TipConfig` — mismo criterio que
// `FeeCalculatorService` con `PlatformCommissionConfig` (sin config, la feature igual funciona
// con un default seguro en vez de romper).
const DEFAULT_CONFIG: TipConfigResponseDTO = {
  isEnabled: true,
  isMandatory: false,
  suggestedPercentages: [10, 15, 20],
  allowFreeAmount: true,
};

@Injectable()
export class TipsService {
  constructor(
    private readonly tipsDb: TipsDbService,
    private readonly paymentDb: PaymentDbService,
  ) {}

  /**
   * Config activa — Paraguay-only por ahora (mismo criterio ya documentado para
   * `LegalDocumentVersions`: sin país resuelto por Service/User todavía, siempre se pide el
   * default global `countryId: null`).
   */
  async getConfig(): Promise<TipConfigResponseDTO> {
    const config = await this.tipsDb.findActiveConfig(null);
    if (!config) return DEFAULT_CONFIG;
    return {
      isEnabled: config.isEnabled,
      isMandatory: config.isMandatory,
      suggestedPercentages: config.suggestedPercentages as unknown as number[],
      allowFreeAmount: config.allowFreeAmount,
    };
  }

  async createTip(
    paymentReferenceId: string,
    userId: number,
    dto: CreateTipRequestDTO,
  ): Promise<TipResponseDTO> {
    const payment =
      await this.paymentDb.findPaymentByReferenceId(paymentReferenceId);
    if (!payment) throw new NotFoundException(t('tips.PAYMENT_NOT_FOUND'));
    if (payment.userId !== userId) {
      throw new ForbiddenException(t('tips.UNAUTHORIZED'));
    }
    if (!ELIGIBLE_PAYMENT_STATUSES.includes(payment.status)) {
      throw new BadRequestException(t('tips.PAYMENT_NOT_ELIGIBLE'));
    }

    const existing = await this.tipsDb.findByPaymentId(payment.id);
    if (existing) throw new BadRequestException(t('tips.ALREADY_TIPPED'));

    const config = await this.getConfig();
    if (!config.isEnabled) {
      throw new BadRequestException(t('tips.TIPS_DISABLED'));
    }
    if (dto.mode === TipMode.FREE && !config.allowFreeAmount) {
      throw new BadRequestException(t('tips.FREE_AMOUNT_NOT_ALLOWED'));
    }

    const amount =
      dto.mode === TipMode.PERCENTAGE
        ? Math.round(
            Number(payment.amount) * ((dto.percentage ?? 0) / 100) * 100,
          ) / 100
        : (dto.amount ?? 0);

    const created = await this.tipsDb.create({
      paymentId: payment.id,
      userId: payment.userId,
      professionalId: payment.professionalId,
      mode: dto.mode,
      percentage: dto.mode === TipMode.PERCENTAGE ? dto.percentage : undefined,
      amount: amount,
      currencyCode: payment.currencyCode,
      createdBy: String(userId),
    });
    return mapTipToResponse(created);
  }

  /**
   * Sin chequeo de propiedad adicional a propósito — mismo criterio ya existente en
   * `PaymentApiService.getPaymentById` (cualquier usuario logueado puede consultar un pago por su
   * referenceId, no hay ownership check ahí tampoco). No se amplía esa laxitud acá, se mantiene
   * consistente con lo que ya existía en el módulo de pagos.
   */
  async getTip(paymentReferenceId: string): Promise<TipResponseDTO | null> {
    const payment =
      await this.paymentDb.findPaymentByReferenceId(paymentReferenceId);
    if (!payment) throw new NotFoundException(t('tips.PAYMENT_NOT_FOUND'));
    const tip = await this.tipsDb.findByPaymentId(payment.id);
    return tip ? mapTipToResponse(tip) : null;
  }
}
