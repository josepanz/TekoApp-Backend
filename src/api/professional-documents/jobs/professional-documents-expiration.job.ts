import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DocumentReviewStatus } from '@prisma/client';
import { ProfessionalDocumentsDbService } from '@modules/professional-documents-db/services/professional-documents-db.service';
import { ProfessionalVerificationHelper } from '@modules/professional-documents-db/helpers/professional-verification.helper';
import { NotificationType } from '@/modules/notifications-db/enums/notification-type.enum';
import { NotificationsService } from '@api/notifications/services/notifications.service';
import { t } from '@common/i18n/i18n.helper';

/**
 * Barrido diario de `ProfessionalDocuments` vencidos — `@Cron` en vez de un `@Processor`/`@Process`
 * de Bull (a diferencia de lo que decía la spec original, "mismo mecanismo que NotificationsProcessor"):
 * `NotificationsProcessor` es un CONSUMIDOR de cola (reacciona a jobs encolados), no algo que corre
 * solo de forma periódica — para un barrido programado, `@Cron` (ya registrado globalmente vía
 * `ScheduleModule.forRoot()`) es el mecanismo correcto de NestJS. Sí se reusa la cola real de
 * notificaciones (`NotificationsService.create` → encola `send-notification`) para el aviso al
 * profesional, que es lo que la spec realmente pedía lograr. Ver openspec/decisions.md.
 */
@Injectable()
export class ProfessionalDocumentsExpirationJob {
  private readonly logger = new Logger(ProfessionalDocumentsExpirationJob.name);

  constructor(
    private readonly documentsDb: ProfessionalDocumentsDbService,
    private readonly verificationHelper: ProfessionalVerificationHelper,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async run(): Promise<void> {
    const expired = await this.documentsDb.findExpiredApproved();
    if (expired.length === 0) return;

    this.logger.log(
      `Venciendo ${expired.length} documento(s) profesional(es).`,
    );

    const affectedProfessionalIds = new Set<number>();
    for (const document of expired) {
      const updatedCount = await this.documentsDb.updateStatusConditional(
        document.id,
        [DocumentReviewStatus.APPROVED],
        { status: DocumentReviewStatus.EXPIRED },
      );
      if (updatedCount === 0) continue; // ya cambiado por otro proceso mientras tanto

      affectedProfessionalIds.add(document.professionalId);
      await this.notificationsService.create(
        {
          title: t('professional-documents.EXPIRED_NOTIFICATION_TITLE'),
          message: t('professional-documents.EXPIRED_NOTIFICATION_MESSAGE'),
          type: NotificationType.DOCUMENT_EXPIRED,
          channels: ['in_app', 'push'],
        },
        document.professional.userId,
      );
    }

    for (const professionalId of affectedProfessionalIds) {
      await this.verificationHelper.recompute(professionalId);
    }
  }
}
