import { createHash } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LegalDocumentType, Prisma } from '@prisma/client';
import { ContractsDbService } from '@modules/contracts-db/services/contracts-db.service';
import { BudgetsDbService } from '@modules/budgets-db/services/budgets-db.service';
import { LegalConsentsDbService } from '@modules/legal-consents-db/services/legal-consents-db.service';
import { StorageService } from '@modules/storage/services/storage.service';
import { ReportService } from '@modules/report/services/report.service';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { NotificationsService } from '@api/notifications/services/notifications.service';
import { NotificationType } from '@modules/notifications-db/enums/notification-type.enum';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { PaginationQueryDTO } from '@common/dtos/pagination.dto';
import { t } from '@common/i18n/i18n.helper';
import {
  ContractPdfResponseDTO,
  ContractResponseDTO,
  ContractsAuditListResponseDTO,
  MyContractsListResponseDTO,
} from '../dtos/response';
import { SignContractRequestDTO } from '../dtos/request';
import {
  mapContractsToAuditResponse,
  mapContractsToMySummary,
  mapContractToResponse,
} from '../helpers/contracts-response.helper';
import { buildContractPdfDefinition } from '../helpers/contracts-pdf.helper';

const PRISMA_UNIQUE_CONSTRAINT_ERROR = 'P2002';

@Injectable()
export class ContractsService {
  constructor(
    private readonly contractsDb: ContractsDbService,
    private readonly budgetsDb: BudgetsDbService,
    private readonly legalConsentsDb: LegalConsentsDbService,
    private readonly storageService: StorageService,
    private readonly reportService: ReportService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async generateContract(
    budgetOptionReferenceId: string,
    userId: number,
    createdBy: string,
  ): Promise<ContractResponseDTO> {
    const option = await this.budgetsDb.findByReferenceIdWithFullContext(
      budgetOptionReferenceId,
    );
    if (!option) throw new NotFoundException(t('contracts.OPTION_NOT_FOUND'));

    const { serviceRequest } = option;
    const { service, professional } = serviceRequest;
    if (service.userId !== userId) {
      throw new ForbiddenException(t('contracts.ONLY_CLIENT_CAN_GENERATE'));
    }
    if (!option.isSelected) {
      throw new BadRequestException(t('contracts.OPTION_NOT_SELECTED'));
    }

    const existing = await this.contractsDb.findByBudgetOptionId(option.id);
    if (existing) return mapContractToResponse(existing, 'CLIENT');

    const legalTermsVersion =
      await this.legalConsentsDb.findActiveVersionByType(
        LegalDocumentType.SERVICE_CONTRACT_TERMS,
      );

    const contentSnapshot = {
      service: {
        title: service.title,
        description: service.description,
        categoryName: service.category.name,
      },
      budgetOption: {
        label: option.label,
        description: option.description,
        totalPrice: Number(option.totalPrice),
        estimatedHours: option.estimatedHours
          ? Number(option.estimatedHours)
          : null,
      },
      lineItems: option.lineItems.map((item) => ({
        itemType: item.itemType,
        catalogItemName: item.catalogItem?.name ?? null,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
    };

    try {
      const created = await this.contractsDb.create({
        serviceId: service.id,
        budgetOptionId: option.id,
        clientUserId: service.userId,
        professionalId: professional.id,
        legalTermsVersionId: legalTermsVersion?.id ?? null,
        contentSnapshot: contentSnapshot,
        createdBy,
      });

      // I-05 (#12, IMPRESCINDIBLE): sin este aviso el profesional nunca sabe que el contrato
      // existe y el trato se estanca — disparado solo en la creación real, no en las dos ramas
      // de "ya existía" (ese profesional ya fue notificado la primera vez).
      await this.notificationsService.create(
        {
          title: t('contracts.NOTIFICATION_CONTRACT_CREATED_TITLE'),
          message: t('contracts.NOTIFICATION_CONTRACT_CREATED_MESSAGE'),
          type: NotificationType.CONTRACT_CREATED,
          channels: ['in_app', 'push'],
        },
        professional.userId,
      );

      return mapContractToResponse(created, 'CLIENT');
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR
      ) {
        const raceExisting = await this.contractsDb.findByBudgetOptionId(
          option.id,
        );
        if (raceExisting) return mapContractToResponse(raceExisting, 'CLIENT');
      }
      throw error;
    }
  }

  async getContract(
    referenceId: string,
    userId: number,
  ): Promise<ContractResponseDTO> {
    const contract = await this.contractsDb.findByReferenceId(referenceId);
    if (!contract)
      throw new NotFoundException(t('contracts.CONTRACT_NOT_FOUND'));

    const isClient = contract.clientUserId === userId;
    const isProfessional = contract.professional.userId === userId;
    if (!isClient && !isProfessional) {
      throw new ForbiddenException(t('contracts.NOT_A_PARTY'));
    }

    return mapContractToResponse(
      contract,
      isClient ? 'CLIENT' : 'PROFESSIONAL',
    );
  }

  async signContract(
    referenceId: string,
    userId: number,
    dto: SignContractRequestDTO,
  ): Promise<ContractResponseDTO> {
    if (!dto.accepted) {
      throw new BadRequestException(t('contracts.MUST_ACCEPT'));
    }

    const contract = await this.contractsDb.findByReferenceId(referenceId);
    if (!contract)
      throw new NotFoundException(t('contracts.CONTRACT_NOT_FOUND'));

    const isClient = contract.clientUserId === userId;
    const isProfessional = contract.professional.userId === userId;
    if (!isClient && !isProfessional) {
      throw new ForbiddenException(t('contracts.NOT_A_PARTY'));
    }

    const signedAt = new Date();
    const role = isClient ? 'client' : 'professional';
    const signatureHash = createHash('sha256')
      .update(
        `${contract.id}:${role}:${dto.fullName}:${JSON.stringify(contract.contentSnapshot)}:${signedAt.toISOString()}`,
      )
      .digest('hex');

    const updatedCount =
      role === 'client'
        ? await this.contractsDb.signAsClientTransaction(
            contract.id,
            dto.fullName,
            signatureHash,
            signedAt,
          )
        : await this.contractsDb.signAsProfessionalTransaction(
            contract.id,
            dto.fullName,
            signatureHash,
            signedAt,
          );

    if (updatedCount === 0) {
      throw new ConflictException(t('contracts.SIGNATURE_OUT_OF_TURN'));
    }

    const updated = await this.contractsDb.findByReferenceId(referenceId);
    if (!updated)
      throw new NotFoundException(t('contracts.CONTRACT_NOT_FOUND'));

    if (updated.status === 'SIGNED') {
      await this.generateAndStorePdf(updated);

      // I-05 (#14, IMPRESCINDIBLE): confirmación legal de que el contrato es efectivo y el PDF
      // ya está disponible — avisar a ambas partes, después de que el PDF quedó generado y
      // guardado (mismo momento que pide la fila #14 de la spec).
      await Promise.all([
        this.notificationsService.create(
          {
            title: t('contracts.NOTIFICATION_CONTRACT_SIGNED_TITLE'),
            message: t('contracts.NOTIFICATION_CONTRACT_SIGNED_MESSAGE'),
            type: NotificationType.CONTRACT_SIGNED,
            channels: ['in_app', 'push'],
          },
          updated.clientUserId,
        ),
        this.notificationsService.create(
          {
            title: t('contracts.NOTIFICATION_CONTRACT_SIGNED_TITLE'),
            message: t('contracts.NOTIFICATION_CONTRACT_SIGNED_MESSAGE'),
            type: NotificationType.CONTRACT_SIGNED,
            channels: ['in_app', 'push'],
          },
          updated.professional.userId,
        ),
      ]);
    } else {
      // I-05 (#13, IMPRESCINDIBLE): "te toca firmar" — avisar a la contraparte que todavía no
      // firmó. `isClient` es quien acaba de firmar; la contraparte es la otra.
      const counterpartyUserId = isClient
        ? updated.professional.userId
        : updated.clientUserId;
      await this.notificationsService.create(
        {
          title: t('contracts.NOTIFICATION_AWAITING_SIGNATURE_TITLE'),
          message: t('contracts.NOTIFICATION_AWAITING_SIGNATURE_MESSAGE'),
          type: NotificationType.CONTRACT_AWAITING_SIGNATURE,
          channels: ['in_app', 'push'],
        },
        counterpartyUserId,
      );
    }

    const final = await this.contractsDb.findByReferenceId(referenceId);
    return mapContractToResponse(final, isClient ? 'CLIENT' : 'PROFESSIONAL');
  }

  async getPdfUrl(
    referenceId: string,
    user: IUserDataOnJwt,
  ): Promise<ContractPdfResponseDTO> {
    const contract = await this.contractsDb.findByReferenceId(referenceId);
    if (!contract)
      throw new NotFoundException(t('contracts.CONTRACT_NOT_FOUND'));

    const isClient = contract.clientUserId === user.id;
    const isProfessional = contract.professional.userId === user.id;
    const isStaff =
      user.permissions.includes(PERMISSIONS.CONTRACTS.AUDIT_VIEW) ||
      user.permissions.includes(PERMISSIONS.ADMIN.ALL);
    if (!isClient && !isProfessional && !isStaff) {
      throw new ForbiddenException(t('contracts.NOT_A_PARTY'));
    }

    if (contract.status !== 'SIGNED' || !contract.pdfKey) {
      throw new ForbiddenException(t('contracts.PDF_NOT_READY'));
    }

    const url = await this.storageService.getPresignedUrlQueue({
      key: contract.pdfKey,
    });
    return { url };
  }

  async listMine(userId: number): Promise<MyContractsListResponseDTO> {
    const contracts = await this.contractsDb.findByUserId(userId);
    return { data: mapContractsToMySummary(contracts) };
  }

  async listAudit(
    query: PaginationQueryDTO,
  ): Promise<ContractsAuditListResponseDTO> {
    const { data, pagination } = await this.contractsDb.findAuditPaginated(
      query as PaginationQueryDTO & Record<string, unknown>,
    );
    return { data: mapContractsToAuditResponse(data), pagination };
  }

  private async generateAndStorePdf(
    contract: Awaited<ReturnType<ContractsDbService['findByReferenceId']>>,
  ): Promise<void> {
    if (!contract) return;
    const definition = buildContractPdfDefinition(contract);
    const buffer = await this.reportService.generate(
      { metadata: {}, items: [] },
      { format: 'pdf', pdfEngine: 'native', nativeDefinition: definition },
    );

    const key = `contracts/${contract.referenceId}.pdf`;
    await this.storageService.uploadFilesQueue([
      {
        file: {
          buffer,
          mimetype: 'application/pdf',
        } as Express.Multer.File,
        key,
        contentType: 'application/pdf',
      },
    ]);
    await this.contractsDb.setPdfKey(contract.id, key);
  }
}
