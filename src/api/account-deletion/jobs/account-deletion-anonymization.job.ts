import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountDeletionDbService } from '@modules/account-deletion-db/services/account-deletion-db.service';
import { StorageService } from '@modules/storage/services/storage.service';

/**
 * Barrido diario de cuentas con la ventana de gracia de borrado vencida — mismo mecanismo
 * (`@Cron`, no un `@Processor` de Bull) que `ProfessionalDocumentsExpirationJob` y por la misma
 * razón: es un barrido periódico, no un consumidor reactivo de cola. Corre a las 4am, una hora
 * después de ese job, para no competir por los mismos recursos.
 */
@Injectable()
export class AccountDeletionAnonymizationJob {
  private readonly logger = new Logger(AccountDeletionAnonymizationJob.name);

  constructor(
    private readonly accountDeletionDb: AccountDeletionDbService,
    private readonly storageService: StorageService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async run(): Promise<void> {
    const dueUsers = await this.accountDeletionDb.findDueForAnonymization();
    if (dueUsers.length === 0) return;

    this.logger.log(`Anonimizando ${dueUsers.length} cuenta(s) vencida(s).`);

    for (const user of dueUsers) {
      const keysToDelete = await this.accountDeletionDb.anonymizeUser(user);
      if (keysToDelete === null) continue; // se canceló entre el barrido y esta llamada
      if (keysToDelete.length > 0) {
        await this.storageService.deleteFileBatch(keysToDelete);
      }
    }
  }
}
