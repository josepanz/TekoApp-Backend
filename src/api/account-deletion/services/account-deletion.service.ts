import {
  Inject,
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  ContractStatus,
  PaymentStatus,
  ServiceStatus,
  UserStatus,
} from '@prisma/client';
import { APP_CONFIG, AppConfigType } from '@core/config/config-loader';
import { AccountDeletionDbService } from '@modules/account-deletion-db/services/account-deletion-db.service';
import {
  DeletionBlocker,
  DeletionBlockerType,
} from '@modules/account-deletion-db/interfaces/account-deletion-db.interface';
import { ProfessionalsDbService } from '@modules/professionals-db/services/professionals-db.service';
import { ServicesDbService } from '@modules/services-db/services/services-db.service';
import { PaymentDbService } from '@modules/payments-db/services/payment-db.service';
import { ContractsDbService } from '@modules/contracts-db/services/contracts-db.service';
import { PaymentDisputesDbService } from '@modules/payment-disputes-db/services/payment-disputes-db.service';
import { t } from '@common/i18n/i18n.helper';
import {
  DeletionCancelResponseDTO,
  DeletionRequestResponseDTO,
} from '../dtos/response';

const ACTIVE_SERVICE_STATUSES = [
  ServiceStatus.PENDING,
  ServiceStatus.ACCEPTED,
  ServiceStatus.IN_PROGRESS,
];
const PENDING_PAYMENT_STATUSES = [
  PaymentStatus.PENDING,
  PaymentStatus.PROCESSING,
];
const UNSIGNED_CONTRACT_STATUSES = [
  ContractStatus.DRAFT,
  ContractStatus.PENDING_CLIENT_SIGNATURE,
  ContractStatus.PENDING_PROFESSIONAL_SIGNATURE,
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class AccountDeletionService {
  constructor(
    private readonly accountDeletionDb: AccountDeletionDbService,
    private readonly professionalsDb: ProfessionalsDbService,
    private readonly servicesDb: ServicesDbService,
    private readonly paymentDb: PaymentDbService,
    private readonly contractsDb: ContractsDbService,
    private readonly disputesDb: PaymentDisputesDbService,
    @Inject(APP_CONFIG.KEY)
    private readonly configService: ConfigType<AppConfigType>,
  ) {}

  // Verificado contra el usuario que pide el borrado actuando como cliente O como profesional
  // (si tiene perfil) — ver I-01-account-deletion.md, tabla de bloqueantes.
  private async findBlockers(
    userId: number,
    professionalId: number | null,
  ): Promise<DeletionBlocker[]> {
    const [activeServices, pendingPayments, unsignedContracts, openDisputes] =
      await Promise.all([
        this.servicesDb.countServices({
          status: { in: ACTIVE_SERVICE_STATUSES },
          OR: professionalId ? [{ userId }, { professionalId }] : [{ userId }],
        }),
        this.paymentDb.countPayments({
          userId,
          status: { in: PENDING_PAYMENT_STATUSES },
        }),
        this.contractsDb.countContracts({
          status: { in: UNSIGNED_CONTRACT_STATUSES },
          OR: professionalId
            ? [{ clientUserId: userId }, { professionalId }]
            : [{ clientUserId: userId }],
        }),
        // I-03: cierra el cabo suelto que I-01 dejó pendiente ("Disputa abierta (I-03)" en la
        // tabla de bloqueantes de I-01-account-deletion.md) — `PaymentDisputes` no existía
        // todavía cuando se implementó I-01.
        this.disputesDb.countOpenDisputesForUser(userId, professionalId),
      ]);

    const blockers: DeletionBlocker[] = [];
    if (activeServices > 0) {
      blockers.push({
        type: DeletionBlockerType.ACTIVE_SERVICE,
        count: activeServices,
      });
    }
    if (pendingPayments > 0) {
      blockers.push({
        type: DeletionBlockerType.PENDING_PAYMENT,
        count: pendingPayments,
      });
    }
    if (unsignedContracts > 0) {
      blockers.push({
        type: DeletionBlockerType.UNSIGNED_CONTRACT,
        count: unsignedContracts,
      });
    }
    if (openDisputes > 0) {
      blockers.push({
        type: DeletionBlockerType.OPEN_DISPUTE,
        count: openDisputes,
      });
    }
    return blockers;
  }

  async requestDeletion(userId: number): Promise<DeletionRequestResponseDTO> {
    const professionalId =
      await this.professionalsDb.findProfessionalIdByUserId(userId);
    const blockers = await this.findBlockers(userId, professionalId);
    if (blockers.length > 0) {
      throw new ConflictException({
        message: t('account-deletion.DELETION_BLOCKED'),
        errorCode: 'DELETION_BLOCKED',
        details: { blockers },
      });
    }

    const requestedAt = new Date();
    const gracePeriodDays = this.configService.accountDeletion.gracePeriodDays;
    const scheduledAt = new Date(
      requestedAt.getTime() + gracePeriodDays * MS_PER_DAY,
    );

    const updatedCount = await this.accountDeletionDb.requestDeletion(
      userId,
      requestedAt,
      scheduledAt,
    );
    if (updatedCount === 0) {
      throw new ConflictException({
        message: t('account-deletion.DELETION_ALREADY_REQUESTED'),
        errorCode: 'DELETION_ALREADY_REQUESTED',
      });
    }

    return {
      status: UserStatus.PENDING_DELETION,
      deletionRequestedAt: requestedAt,
      deletionScheduledAt: scheduledAt,
    };
  }

  async cancelDeletion(userId: number): Promise<DeletionCancelResponseDTO> {
    const updatedCount = await this.accountDeletionDb.cancelDeletion(userId);
    if (updatedCount === 0) {
      throw new BadRequestException({
        message: t('account-deletion.DELETION_NOT_REQUESTED'),
        errorCode: 'DELETION_NOT_REQUESTED',
      });
    }
    return { status: UserStatus.ACTIVE };
  }
}
