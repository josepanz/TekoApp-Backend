import { Injectable } from '@nestjs/common';
import { ContractStatus, Contracts, Prisma } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PrismaPaginationUtil } from '@common/utils/prisma-pagination.util';
import {
  PaginationQueryDTO,
  PaginationResponseDTO,
} from '@common/dtos/pagination.dto';

const contractDetailInclude = {
  legalTermsVersion: {
    select: { referenceId: true, version: true, contentUrl: true },
  },
  client: { select: { firstName: true, lastName: true } },
  professional: {
    select: {
      userId: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.ContractsInclude;

export type ContractWithLegalTerms = Prisma.ContractsGetPayload<{
  include: typeof contractDetailInclude;
}>;

const contractAuditInclude = {
  service: { select: { referenceId: true } },
  client: { select: { referenceId: true } },
  professional: { select: { referenceId: true } },
} satisfies Prisma.ContractsInclude;

export type ContractAuditRow = Prisma.ContractsGetPayload<{
  include: typeof contractAuditInclude;
}>;

export interface CreateContractInput {
  serviceId: number;
  budgetOptionId: number;
  clientUserId: number;
  professionalId: number;
  legalTermsVersionId: number | null;
  contentSnapshot: Prisma.InputJsonValue;
  createdBy: string;
}

@Injectable()
export class ContractsDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async findByReferenceId(
    referenceId: string,
  ): Promise<ContractWithLegalTerms | null> {
    return this.prisma.extended.contracts.findUnique({
      where: { referenceId },
      include: contractDetailInclude,
    });
  }

  /** Listado "mis contratos" — cliente O profesional del contrato, sin paginar (volumen bajo por
   * usuario, mismo criterio que `ProfessionalDocumentsService.myDocuments`). */
  async findByUserId(userId: number): Promise<Contracts[]> {
    return this.prisma.extended.contracts.findMany({
      where: { OR: [{ clientUserId: userId }, { professional: { userId } }] },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByBudgetOptionId(
    budgetOptionId: number,
  ): Promise<ContractWithLegalTerms | null> {
    return this.prisma.extended.contracts.findUnique({
      where: { budgetOptionId },
      include: contractDetailInclude,
    });
  }

  /**
   * Se crea directo en `PENDING_CLIENT_SIGNATURE` — a diferencia de las transiciones posteriores,
   * la creación es un único INSERT sin ventana de carrera que proteger con `updateMany`
   * condicional (`DRAFT` queda como estado válido del enum para un futuro flujo de revisión antes
   * de notificar al cliente, no usado todavía).
   */
  async create(input: CreateContractInput): Promise<ContractWithLegalTerms> {
    return this.prisma.extended.contracts.create({
      data: {
        serviceId: input.serviceId,
        budgetOptionId: input.budgetOptionId,
        clientUserId: input.clientUserId,
        professionalId: input.professionalId,
        legalTermsVersionId: input.legalTermsVersionId,
        contentSnapshot: input.contentSnapshot,
        status: ContractStatus.PENDING_CLIENT_SIGNATURE,
        createdBy: input.createdBy,
      },
      include: contractDetailInclude,
    });
  }

  /**
   * TOCTOU-safe vía `updateMany` condicional (`WHERE id = ? AND status = <esperado>`) — nunca
   * `findUnique` + `update` incondicional. Devuelve `count` (0 = firma duplicada o fuera de
   * turno, el caller traduce eso a 409).
   */
  async signAsClientTransaction(
    contractId: number,
    signatureName: string,
    signatureHash: string,
    signedAt: Date,
  ): Promise<number> {
    const result = await this.prisma.extended.contracts.updateMany({
      where: {
        id: contractId,
        status: ContractStatus.PENDING_CLIENT_SIGNATURE,
      },
      data: {
        status: ContractStatus.PENDING_PROFESSIONAL_SIGNATURE,
        clientSignedAt: signedAt,
        clientSignatureName: signatureName,
        clientSignatureHash: signatureHash,
      },
    });
    return result.count;
  }

  async signAsProfessionalTransaction(
    contractId: number,
    signatureName: string,
    signatureHash: string,
    signedAt: Date,
  ): Promise<number> {
    const result = await this.prisma.extended.contracts.updateMany({
      where: {
        id: contractId,
        status: ContractStatus.PENDING_PROFESSIONAL_SIGNATURE,
      },
      data: {
        status: ContractStatus.SIGNED,
        professionalSignedAt: signedAt,
        professionalSignatureName: signatureName,
        professionalSignatureHash: signatureHash,
      },
    });
    return result.count;
  }

  async setPdfKey(contractId: number, pdfKey: string): Promise<void> {
    await this.prisma.extended.contracts.update({
      where: { id: contractId },
      data: { pdfKey },
    });
  }

  /** `status` es columna directa — se deja que `PrismaPaginationUtil` la mapee automáticamente. */
  async findAuditPaginated(
    query: PaginationQueryDTO & Record<string, unknown>,
  ): Promise<{ data: ContractAuditRow[]; pagination: PaginationResponseDTO }> {
    return PrismaPaginationUtil.paginate<ContractAuditRow>(
      this.prisma.extended.contracts,
      query,
      { defaultOrderByField: 'createdAt', include: contractAuditInclude },
    );
  }
}
