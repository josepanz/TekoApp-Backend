import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DisputeResolution,
  DisputeStatus,
  PaymentStatus,
} from '@prisma/client';
import { PaymentDbService } from '@modules/payments-db/services/payment-db.service';
import { ProfessionalsDbService } from '@modules/professionals-db/services/professionals-db.service';
import { PaymentDisputesDbService } from '@modules/payment-disputes-db/services/payment-disputes-db.service';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { PaginationQueryDTO } from '@common/dtos/pagination.dto';
import { t } from '@common/i18n/i18n.helper';
import {
  CreateDisputeRequestDTO,
  ResolveDisputeRequestDTO,
} from '../dtos/request';
import {
  DisputeResponseDTO,
  DisputesListResponseDTO,
  DisputesQueueResponseDTO,
} from '../dtos/response';
import {
  mapDisputeToResponse,
  mapDisputesToResponse,
} from '../helpers/payment-disputes-response.helper';

// Regla de negocio #3 de I-03-dispute-records.md: mismo universo de estados que ya exige
// `PaymentDbService.executeRefund` (payment-db.service.ts) para ser reembolsable.
const DISPUTABLE_PAYMENT_STATUSES: PaymentStatus[] = [
  PaymentStatus.COMPLETED,
  PaymentStatus.PARTIAL_REFUNDED,
];

const REFUND_RESOLUTIONS: DisputeResolution[] = [
  DisputeResolution.FULL_REFUND,
  DisputeResolution.PARTIAL_REFUND,
];

@Injectable()
export class PaymentDisputesService {
  constructor(
    private readonly paymentDb: PaymentDbService,
    private readonly professionalsDb: ProfessionalsDbService,
    private readonly disputesDb: PaymentDisputesDbService,
  ) {}

  /** Resuelve el pago por su referenceId y determina si `userId` es cliente y/o profesional. */
  private async resolvePaymentParty(
    paymentReferenceId: string,
    userId: number,
  ) {
    const payment =
      await this.paymentDb.findPaymentByReferenceId(paymentReferenceId);
    if (!payment) throw new NotFoundException(t('payments.NOT_FOUND'));

    const professional = await this.professionalsDb.findById(
      payment.professionalId,
    );
    const isClient = payment.userId === userId;
    const isProfessional = professional.userId === userId;
    return { payment, isClient, isProfessional };
  }

  async openDispute(
    paymentReferenceId: string,
    userId: number,
    createdBy: string,
    dto: CreateDisputeRequestDTO,
  ): Promise<DisputeResponseDTO> {
    const { payment, isClient, isProfessional } =
      await this.resolvePaymentParty(paymentReferenceId, userId);
    if (!isClient && !isProfessional) {
      throw new ForbiddenException(t('disputes.NOT_A_PARTY'));
    }
    if (!DISPUTABLE_PAYMENT_STATUSES.includes(payment.status)) {
      throw new BadRequestException(t('disputes.PAYMENT_NOT_DISPUTABLE'));
    }

    const activeDispute = await this.disputesDb.findActiveDisputeForPayment(
      payment.id,
    );
    if (activeDispute) {
      throw new ConflictException(t('disputes.ALREADY_HAS_OPEN_DISPUTE'));
    }

    const created = await this.disputesDb.create({
      paymentId: payment.id,
      openedByUserId: userId,
      reason: dto.reason,
      description: dto.description,
      evidenceKeys: dto.evidenceKeys ?? [],
      createdBy,
    });
    return mapDisputeToResponse(created);
  }

  async listForPayment(
    paymentReferenceId: string,
    user: IUserDataOnJwt,
  ): Promise<DisputesListResponseDTO> {
    const { payment, isClient, isProfessional } =
      await this.resolvePaymentParty(paymentReferenceId, user.id);
    const isPrivileged =
      user.permissions.includes(PERMISSIONS.PAYMENTS.AUDIT_VIEW) ||
      user.permissions.includes(PERMISSIONS.ADMIN.ALL);
    if (!isClient && !isProfessional && !isPrivileged) {
      throw new ForbiddenException(t('disputes.NOT_A_PARTY'));
    }

    const disputes = await this.disputesDb.findByPaymentId(payment.id);
    return { data: mapDisputesToResponse(disputes) };
  }

  async listQueue(
    query: PaginationQueryDTO,
  ): Promise<DisputesQueueResponseDTO> {
    const { data, pagination } = await this.disputesDb.findQueuePaginated(
      query as PaginationQueryDTO & Record<string, unknown>,
    );
    return { data: mapDisputesToResponse(data), pagination };
  }

  async claim(
    disputeReferenceId: string,
    staffUserId: number,
  ): Promise<DisputeResponseDTO> {
    const dispute = await this.disputesDb.findByReferenceId(disputeReferenceId);
    if (!dispute) throw new NotFoundException(t('disputes.NOT_FOUND'));

    const updatedCount = await this.disputesDb.claim(dispute.id, staffUserId);
    if (updatedCount === 0) {
      throw new ConflictException(t('disputes.ALREADY_CLAIMED'));
    }

    const updated = await this.disputesDb.findByReferenceId(disputeReferenceId);
    return mapDisputeToResponse(updated);
  }

  async resolve(
    disputeReferenceId: string,
    staffUserId: number,
    dto: ResolveDisputeRequestDTO,
  ): Promise<DisputeResponseDTO> {
    const dispute = await this.disputesDb.findByReferenceId(disputeReferenceId);
    if (!dispute) throw new NotFoundException(t('disputes.NOT_FOUND'));

    if (REFUND_RESOLUTIONS.includes(dto.resolution) && !dto.refundAmount) {
      throw new BadRequestException(t('disputes.REFUND_AMOUNT_REQUIRED'));
    }

    const updatedCount = await this.disputesDb.resolve(
      dispute.id,
      staffUserId,
      {
        resolution: dto.resolution,
        resolutionNotes: dto.resolutionNotes,
        refundAmount: dto.refundAmount,
      },
    );
    if (updatedCount === 0) {
      throw new ConflictException(t('disputes.ALREADY_RESOLVED'));
    }

    const updated = await this.disputesDb.findByReferenceId(disputeReferenceId);
    return mapDisputeToResponse(updated);
  }

  async withdraw(
    paymentReferenceId: string,
    disputeReferenceId: string,
    requesterUserId: number,
  ): Promise<DisputeResponseDTO> {
    const payment =
      await this.paymentDb.findPaymentByReferenceId(paymentReferenceId);
    if (!payment) throw new NotFoundException(t('payments.NOT_FOUND'));

    const dispute = await this.disputesDb.findByReferenceId(disputeReferenceId);
    // Evita confirmar la existencia de una disputa de OTRO pago vía la URL — mismo criterio de
    // "no leak" que el resto de los 404 de este repo.
    if (!dispute || dispute.payment.referenceId !== payment.referenceId) {
      throw new NotFoundException(t('disputes.NOT_FOUND'));
    }
    if (dispute.openedByUserId !== requesterUserId) {
      throw new ForbiddenException(t('disputes.NOT_OPENER'));
    }
    if (dispute.status !== DisputeStatus.OPEN) {
      throw new ConflictException(t('disputes.CANNOT_WITHDRAW'));
    }

    const updatedCount = await this.disputesDb.withdraw(
      dispute.id,
      requesterUserId,
    );
    if (updatedCount === 0) {
      throw new ConflictException(t('disputes.CANNOT_WITHDRAW'));
    }

    const updated = await this.disputesDb.findByReferenceId(disputeReferenceId);
    return mapDisputeToResponse(updated);
  }
}
