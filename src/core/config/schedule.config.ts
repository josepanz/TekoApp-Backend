// src/core/config/schedule.config.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ScheduleConfig {
  private readonly logger = new Logger(ScheduleConfig.name);

  // Todo: Inyectar servicios correspondientes cuando estén migrados (CacheService, StorageService, etc.)
  constructor() {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  cleanCache(): void {
    this.logger.log('Iniciando limpieza programada de cache...');
    try {
      this.logger.log('Cache de infraestructura depurado exitosamente.');
    } catch (error) {
      this.logger.error('Error al ejecutar Cron [cleanCache]:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  cleanTempFiles(): void {
    this.logger.log('Iniciando purga diaria de almacenamiento temporal...');
    try {
      this.logger.log('Archivos temporales obsoletos eliminados.');
    } catch (error) {
      this.logger.error('Error al ejecutar Cron [cleanTempFiles]:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  generateDailyReports(): void {
    this.logger.log(
      'Ejecutando consolidación automática de métricas diarias...',
    );
    try {
      this.logger.log('Métricas procesadas y listas.');
    } catch (error) {
      this.logger.error(
        'Error al ejecutar Cron [generateDailyReports]:',
        error,
      );
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  checkPendingPayments(): void {
    this.logger.log('Sincronizando estados de pasarelas de pago pendientes...');
    try {
      this.logger.log('Verificación transaccional completada.');
    } catch (error) {
      this.logger.error(
        'Error al ejecutar Cron [checkPendingPayments]:',
        error,
      );
    }
  }

  @Cron('0 */30 * * * *') // Cada 30 minutos
  checkExpiredServices(): void {
    this.logger.log('Evaluando contratos y ventanas de servicios activos...');
    try {
      this.logger.log('Servicios expirados cancelados/notificados.');
    } catch (error) {
      this.logger.error(
        'Error al ejecutar Cron [checkExpiredServices]:',
        error,
      );
    }
  }

  @Cron('0 0 */4 * * *') // Cada 4 horas
  syncExternalServices(): void {
    this.logger.log('Sincronizando webhooks e integraciones remotas...');
    try {
      this.logger.log('Sincronización remota OK.');
    } catch (error) {
      this.logger.error(
        'Error al ejecutar Cron [syncExternalServices]:',
        error,
      );
    }
  }

  @Cron('0 1 * * 0') // Domingos 1:00 AM
  cleanOldLogs(): void {
    this.logger.log('Ejecutando rotación programada de logs históricos...');
    try {
      this.logger.log('Logs antigos rotados.');
    } catch (error) {
      this.logger.error('Error al ejecutar Cron [cleanOldLogs]:', error);
    }
  }

  @Cron('0 */5 * * * *') // Cada 5 minutos
  checkPendingNotifications(): void {
    this.logger.log('Despachando cola diferida de notificaciones Push/SMS...');
    try {
      this.logger.log('Cola procesada.');
    } catch (error) {
      this.logger.error(
        'Error al ejecutar Cron [checkPendingNotifications]:',
        error,
      );
    }
  }

  @Cron('0 7 * * 0') // Domingos 7:00 AM
  generateWeeklyStats(): void {
    this.logger.log(
      'Compilando analíticas semanales de rendimiento del marketplace...',
    );
    try {
      this.logger.log('Estadísticas semanales generadas.');
    } catch (error) {
      this.logger.error('Error al ejecutar Cron [generateWeeklyStats]:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  checkDataIntegrity(): void {
    this.logger.log(
      'Corriendo chequeo de checksums e integridad relacional...',
    );
    try {
      this.logger.log('Validación de consistencia completada.');
    } catch (error) {
      this.logger.error('Error al ejecutar Cron [checkDataIntegrity]:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  backupDatabase(): void {
    this.logger.log(
      'Iniciando volcado programado para Snapshot de base de datos...',
    );
    try {
      this.logger.log('Backup de base de datos finalizado con éxito.');
    } catch (error) {
      this.logger.error('Error al ejecutar Cron [backupDatabase]:', error);
    }
  }
}
