import { Injectable } from '@nestjs/common';
import {
  DisputeReason,
  DisputeResolution,
  DisputeStatus,
  Prisma,
} from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PrismaPaginationUtil } from '@common/utils/prisma-pagination.util';
import {
  PaginationQueryDTO,
  PaginationResponseDTO,
} from '@common/dtos/pagination.dto';
import { PaymentDbService } from '@modules/payments-db/services/payment-db.service';

const disputeDetailInclude = {
  payment: { select: { referenceId: true } },
  openedBy: { select: { referenceId: true, firstName: true, lastName: true } },
  adjudicatedBy: {
    select: { referenceId: true, firstName: true, lastName: true },
  },
} satisfies Prisma.PaymentDisputesInclude;

export type PaymentDisputeWithRelations = Prisma.PaymentDisputesGetPayload<{
  include: typeof disputeDetailInclude;
}>;

export interface CreateDisputeInput {
  paymentId: number;
  openedByUserId: number;
  reason: DisputeReason;
  description: string;
  evidenceKeys: string[];
  createdBy: string;
}

export interface ResolveDisputeInput {
  resolution: DisputeResolution;
  resolutionNotes: string;
  refundAmount?: number;
}

const REFUND_RESOLUTIONS: DisputeResolution[] = [
  DisputeResolution.FULL_REFUND,
  DisputeResolution.PARTIAL_REFUND,
];

@Injectable()
export class PaymentDisputesDbService {
  constructor(
    private readonly prisma: PrismaDatasource,
    private readonly paymentDb: PaymentDbService,
  ) {}

  async create(
    input: CreateDisputeInput,
  ): Promise<PaymentDisputeWithRelations> {
    return this.prisma.extended.paymentDisputes.create({
      data: {
        paymentId: input.paymentId,
        openedByUserId: input.openedByUserId,
        reason: input.reason,
        description: input.description,
        evidenceKeys: input.evidenceKeys,
        createdBy: input.createdBy,
      },
      include: disputeDetailInclude,
    });
  }

  async findByReferenceId(
    referenceId: string,
  ): Promise<PaymentDisputeWithRelations | null> {
    return this.prisma.extended.paymentDisputes.findUnique({
      where: { referenceId },
      include: disputeDetailInclude,
    });
  }

  /** Historial de disputas de un pago — volumen bajo por pago, sin paginar. */
  async findByPaymentId(
    paymentId: number,
  ): Promise<PaymentDisputeWithRelations[]> {
    return this.prisma.extended.paymentDisputes.findMany({
      where: { paymentId },
      include: disputeDetailInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Ya existe una disputa `OPEN`/`UNDER_REVIEW` sobre este pago — regla de negocio #2 de la spec. */
  async findActiveDisputeForPayment(
    paymentId: number,
  ): Promise<{ id: number } | null> {
    return this.prisma.extended.paymentDisputes.findFirst({
      where: {
        paymentId,
        status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
      },
      select: { id: true },
    });
  }

  /** Cola de staff, paginada y filtrable por `status` — mismo criterio que `ContractsDbService.findAuditPaginated`. */
  async findQueuePaginated(
    query: PaginationQueryDTO & Record<string, unknown>,
  ): Promise<{
    data: PaymentDisputeWithRelations[];
    pagination: PaginationResponseDTO;
  }> {
    return PrismaPaginationUtil.paginate<PaymentDisputeWithRelations>(
      this.prisma.extended.paymentDisputes,
      query,
      { defaultOrderByField: 'createdAt', include: disputeDetailInclude },
    );
  }

  /**
   * `OPEN` → `UNDER_REVIEW`, TOCTOU-safe vía `updateMany` condicional (regla de negocio #4): dos
   * admins no pueden tomar la misma disputa a la vez. Devuelve `count` (0 = ya la tomó otro staff,
   * o ya no está `OPEN`).
   */
  async claim(id: number, staffUserId: number): Promise<number> {
    const result = await this.prisma.extended.paymentDisputes.updateMany({
      where: { id, status: DisputeStatus.OPEN },
      data: {
        status: DisputeStatus.UNDER_REVIEW,
        adjudicatedByUserId: staffUserId,
      },
    });
    return result.count;
  }

  /**
   * Retiro por quien abrió la disputa, solo mientras siga `OPEN` (regla de negocio #7). El
   * caller ya validó que `requesterUserId` es quien la abrió antes de llamar acá (para poder
   * distinguir 403 de 409 en el mensaje de error) — este `updateMany` repite igual la condición
   * completa como última línea de defensa contra la carrera.
   */
  async withdraw(id: number, requesterUserId: number): Promise<number> {
    const result = await this.prisma.extended.paymentDisputes.updateMany({
      where: {
        id,
        status: DisputeStatus.OPEN,
        openedByUserId: requesterUserId,
      },
      data: { status: DisputeStatus.WITHDRAWN },
    });
    return result.count;
  }

  /**
   * Adjudica la disputa (`RESOLVED`/`REJECTED`) y, si la resolución mueve plata
   * (`FULL_REFUND`/`PARTIAL_REFUND`), dispara `PaymentDbService.executeRefund` DENTRO de la misma
   * transacción — regla de negocio #6: el reembolso es una consecuencia atómica de la
   * adjudicación, no un paso manual aparte (mismo criterio que `ContractsService.signContract`
   * disparando `generateAndStorePdf` al llegar a `SIGNED`, salvo que acá SÍ tiene que ser
   * transaccional porque mueve plata). `updateMany` condicional desde `OPEN`/`UNDER_REVIEW`
   * (regla de negocio #5: esta spec no fuerza el paso por `UNDER_REVIEW`) — devuelve `count === 0`
   * si la disputa ya no está en un estado adjudicable (dos staff resolviendo a la vez, o ya
   * retirada/resuelta).
   */
  async resolve(
    id: number,
    staffUserId: number,
    input: ResolveDisputeInput,
  ): Promise<number> {
    return this.prisma.extended.$transaction(async (tx) => {
      const targetStatus =
        input.resolution === DisputeResolution.NO_REFUND
          ? DisputeStatus.REJECTED
          : DisputeStatus.RESOLVED;

      const updateResult = await tx.paymentDisputes.updateMany({
        where: {
          id,
          status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
        },
        data: {
          status: targetStatus,
          resolution: input.resolution,
          resolutionNotes: input.resolutionNotes,
          refundAmount: input.refundAmount,
          resolvedAt: new Date(),
          adjudicatedByUserId: staffUserId,
        },
      });
      if (updateResult.count === 0) return 0;

      if (REFUND_RESOLUTIONS.includes(input.resolution)) {
        const dispute = await tx.paymentDisputes.findUniqueOrThrow({
          where: { id },
        });
        await this.paymentDb.executeRefund(
          dispute.paymentId,
          input.refundAmount,
          input.resolutionNotes,
          dispute.referenceId,
          tx as unknown as Prisma.TransactionClient,
        );
      }

      return updateResult.count;
    });
  }

  /**
   * Bloqueante de borrado de cuenta (I-01): disputas `OPEN`/`UNDER_REVIEW` donde el usuario es
   * quien la abrió, el cliente del pago, o el profesional del pago.
   */
  async countOpenDisputesForUser(
    userId: number,
    professionalId: number | null,
  ): Promise<number> {
    return this.prisma.extended.paymentDisputes.count({
      where: {
        status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
        OR: [
          { openedByUserId: userId },
          { payment: { userId } },
          ...(professionalId ? [{ payment: { professionalId } }] : []),
        ],
      },
    });
  }
}
