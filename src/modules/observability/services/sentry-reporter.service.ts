import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import { APP_CONFIG, AppConfigType } from '@core/config/config-loader';
import { formatPayload } from '../observability.module';

/**
 * Contexto de request que se adjunta a cada excepción reportada — nunca el body/headers crudos.
 * `body`/`query` pasan por `formatPayload` (mismo sanitizador que ya usan los logs de Seq: tapa
 * `password`/`token`/`secretKey`, trunca payloads >1MB) antes de salir de este servicio.
 */
export interface UnhandledExceptionContext {
  route?: string;
  method?: string;
  requestId?: string;
  userId?: number;
  body?: unknown;
  query?: unknown;
}

// Free tier de GlitchTip: 1.000 eventos/mes — un crash loop lo quema en horas (ver
// openspec/changes/platform-hardening-2026-09/H-01-observability-options.md, "DECISIÓN DE JOSÉ").
// Ventana de deduplicación: el mismo error (mismo fingerprint) no se reenvía más de una vez cada
// DEDUPE_WINDOW_MS. Pasada la ventana, un repetido solo se manda con probabilidad SAMPLE_RATE —
// así un error que sigue disparando indefinidamente no vuelve a consumir cupo a tasa completa.
const DEDUPE_WINDOW_MS = 60_000;
const SAMPLE_RATE_AFTER_DEDUPE = 0.1;

@Injectable()
export class SentryReporterService implements OnModuleInit {
  private readonly logger = new Logger(SentryReporterService.name);
  private readonly lastSentAtByFingerprint = new Map<string, number>();
  private initialized = false;

  constructor(
    @Inject(APP_CONFIG.KEY)
    private readonly configService: ConfigType<AppConfigType>,
  ) {}

  onModuleInit(): void {
    const dsn = this.configService.observability?.glitchtipDsn;
    if (!dsn) {
      this.logger.warn(
        'GLITCHTIP_DSN no configurado: el reporte de excepciones a GlitchTip queda ' +
          'desactivado. La app arranca igual (estado normal mientras no exista la cuenta).',
      );
      return;
    }

    Sentry.init({
      dsn,
      environment: this.configService.env,
      release: this.configService.project.version,
      // Solo error tracking — sin tracing de performance (no aplica a este caso de uso, y evita
      // instrumentación adicional que podría capturar más contexto de request del necesario).
      tracesSampleRate: 0,
      // No enviar IP/cookies por default — el scrubbing lo hace `captureException` acá abajo, no
      // el default de la integración HTTP del SDK.
      sendDefaultPii: false,
      beforeSend: (event) => this.beforeSend(event),
    });
    this.initialized = true;
    this.logger.log('SDK de GlitchTip (Sentry) inicializado');
  }

  /** Uso exclusivo de tests: refleja si `Sentry.init()` llegó a correr. */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reporta una excepción no manejada. No-op si el SDK no está inicializado (sin DSN) — nunca
   * lanza, para que un fallo al reportar no se lleve puesta la respuesta de error real.
   */
  captureException(
    exception: unknown,
    context: UnhandledExceptionContext = {},
  ): void {
    if (!this.initialized) return;

    try {
      Sentry.captureException(exception, {
        contexts: {
          request: {
            route: context.route,
            method: context.method,
            requestId: context.requestId,
            userId: context.userId,
            body: formatPayload(context.body),
            query: formatPayload(context.query),
          },
        },
      });
    } catch (reportingError) {
      const errorMessage =
        reportingError instanceof Error
          ? reportingError.message
          : String(reportingError);
      this.logger.error(
        `Fallo reportando una excepción a GlitchTip (no afecta la respuesta al cliente): ${errorMessage}`,
      );
    }
  }

  private fingerprint(event: Sentry.ErrorEvent): string {
    const exceptionValue = event.exception?.values?.[0];
    const type = exceptionValue?.type ?? 'UnknownError';
    const message = exceptionValue?.value ?? '';
    const frames = exceptionValue?.stacktrace?.frames;
    const topFrame = frames?.[frames.length - 1];
    const frameKey = topFrame ? `${topFrame.filename}:${topFrame.lineno}` : '';
    return `${type}:${message}:${frameKey}`;
  }

  /**
   * Deduplicación + muestreo. Primera vez que se ve un fingerprint: siempre pasa. Repetido dentro
   * de `DEDUPE_WINDOW_MS` desde el último ENVIADO: se descarta. Repetido más allá de esa ventana:
   * pasa solo con probabilidad `SAMPLE_RATE_AFTER_DEDUPE` (y esa evaluación se repite en cada
   * ocurrencia hasta que una pase, sin extender la ventana artificialmente).
   */
  private beforeSend(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
    const key = this.fingerprint(event);
    const now = Date.now();
    const lastSentAt = this.lastSentAtByFingerprint.get(key);

    if (lastSentAt !== undefined) {
      const elapsed = now - lastSentAt;
      if (elapsed < DEDUPE_WINDOW_MS) {
        return null;
      }
      if (Math.random() > SAMPLE_RATE_AFTER_DEDUPE) {
        return null;
      }
    }

    this.lastSentAtByFingerprint.set(key, now);
    return event;
  }
}
