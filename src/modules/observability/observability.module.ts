// core/observability/observability.module.ts
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigType, APP_CONFIG } from '@core/config/config-loader';
import { TRACE_ID_HEADER } from '@core/middlewares/trace-id.middleware';
import { IncomingMessage } from 'http';
import { Request } from 'express';
import { format } from 'date-fns';

const MAX_PAYLOAD_SIZE_BYTES = 1024 * 1024; // 1MB

const sanitizePayload = (payload: any): any => {
  if (!payload) return null;
  if (typeof payload === 'object') {
    const sanitized = { ...payload };
    // Sanitización exhaustiva de credenciales y campos sensibles
    if (sanitized.password) sanitized.password = '***SANITIZED***';
    if (sanitized.token) sanitized.token = '***SANITIZED***';
    if (sanitized.secretKey) sanitized.secretKey = '***SANITIZED***';
    return sanitized;
  }
  return payload;
};

export function formatPayload(payload: unknown): any {
  if (!payload) return null;
  try {
    const jsonString = JSON.stringify(payload);
    const contentLength = Buffer.byteLength(jsonString, 'utf8');
    if (contentLength > MAX_PAYLOAD_SIZE_BYTES) {
      return {
        contentType: 'application/json',
        contentLength,
        bodyLogged: false,
        reason: 'Payload supera el límite máximo permitido para logs (1MB)',
      };
    }
    return sanitizePayload(payload);
  } catch {
    return '[Unparsable Payload]';
  }
}

@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: (configService: ConfigType<AppConfigType>) => {
        const targets: any[] = [
          {
            target: 'pino-pretty',
            options: {
              destination: 1,
              colorize: true,
              singleLine: false,
            },
          },
        ];

        // Habilitar Seq únicamente en entornos remotos si está activo
        if (configService.logger?.seqEnabled && configService.env !== 'local') {
          targets.push({
            target: '@autotelic/pino-seq-transport',
            options: {
              loggerOpts: { serverUrl: configService.logger.seqUrl },
            },
          });
        }

        return {
          pinoHttp: {
            base: {
              name: configService.project.name,
              version: configService.project.version,
              environment: configService.env,
              service: configService.project.name,
            },
            // Usar la función de timestamp nativa de Pino optimizada
            timestamp: () =>
              `,"time":"${format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS')}"`,
            levelKey: 'level',
            messageKey: 'message',
            wrapSerializers: true,

            autoLogging: {
              ignore: (req: IncomingMessage) =>
                req.url?.startsWith('/healthcheck') ?? false, // No spamear logs con las pings de Kubernetes/Terminus
            },

            transport: {
              targets,
            },

            customReceivedMessage: (req) =>
              `🚀 Start | ${req.method} ${req.url} | Trace ID: ${req[TRACE_ID_HEADER] || 'N/A'}`,
            customSuccessMessage: (req, res) =>
              `✅ End | ${req.method} ${req.url} - (${res.statusCode}) | Trace ID: ${req[TRACE_ID_HEADER] || 'N/A'}`,
            customErrorMessage: (req, res) =>
              `❌ Error | ${req.method} ${req.url} - (${res.statusCode}) | Trace ID: ${req[TRACE_ID_HEADER] || 'N/A'}`,

            customProps: (req: Request, res) => {
              const startTime = (req as any)._startTime || Date.now();
              const latencyMs = Date.now() - startTime;

              return {
                type:
                  res.statusCode >= 200 && res.statusCode < 400
                    ? 'Audit'
                    : 'Warn',
                sessionId: req.headers['x-session-id'] ?? undefined,
                entityId: req.headers['x-entity-id'] ?? undefined,
                traceId:
                  req[TRACE_ID_HEADER] ??
                  req.headers[TRACE_ID_HEADER.toLowerCase()],
                correlationId: req.headers['x-correlation-id'] ?? undefined,
                latencyMs,
                sourceIp: req.ip || req.headers['x-forwarded-for'],
                userAgent: req.headers['user-agent'],
              };
            },

            serializers: {
              req: (req: any) => ({
                method: req.method,
                url: req.url,
                headers: {
                  host: req.headers.host,
                  'user-agent': req.headers['user-agent'],
                  accept: req.headers.accept,
                },
                request: req?.body ? formatPayload(req.body) : undefined,
              }),
              res: (res: any) => ({
                statusCode: res.statusCode,
                response: res?.body ? formatPayload(res.body) : undefined,
              }),
              err: (err: any) => ({
                errorMessage: err.message,
                level: 'error',
                stack: configService.env === 'local' ? err.stack : undefined,
              }),
            },
          },
        };
      },
      inject: [APP_CONFIG.KEY],
    }),
  ],
  exports: [LoggerModule],
})
export class ObservabilityModule {}
