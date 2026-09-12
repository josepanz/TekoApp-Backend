import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { t } from '@common/i18n/i18n.helper';
import { TRACE_ID_HEADER } from '@core/middlewares/trace-id.middleware';
import { SentryReporterService } from '@modules/observability/services/sentry-reporter.service';

interface RequestWithTraceAndUser extends Request {
  [TRACE_ID_HEADER]?: string;
  user?: { id?: number };
}

function extractRequestId(
  request?: RequestWithTraceAndUser,
): string | undefined {
  const fromReq = request?.[TRACE_ID_HEADER];
  if (typeof fromReq === 'string') return fromReq;
  const fromHeader = request?.headers?.[TRACE_ID_HEADER.toLowerCase()];
  return typeof fromHeader === 'string' ? fromHeader : undefined;
}

/**
 * Último filtro en la cadena (ver `MiddlewareConfig.setup`, orden de `useGlobalFilters`): por
 * cómo NestJS resuelve el filtro aplicable (`selectExceptionFilterMetadata`, primero el más
 * específico), este `@Catch()` sin tipo SOLO se alcanza cuando ni `ValidationExceptionFilter`
 * (`BadRequestException`) ni `HttpExceptionFilter` (`HttpException`) matchean — o sea, es el
 * único de los tres que ve una excepción NO manejada de verdad (un `Error`/`TypeError` crudo, un
 * error de Prisma no envuelto, etc.). Por eso es acá, y no en `HttpExceptionFilter`, donde se
 * engancha el reporte a GlitchTip (H-01) — verificado leyendo `selectExceptionFilterMetadata` y
 * `RouterExceptionFilters.create` (hace `filters.reverse()` antes de buscar), no asumido por el
 * nombre de la clase.
 */
@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly sentryReporter: SentryReporterService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithTraceAndUser>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = t('common.INTERNAL_SERVER_ERROR');

    if (exception instanceof HttpException) {
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const errorResponse = res as Record<string, unknown>;

        if (typeof errorResponse.message === 'string') {
          message = errorResponse.message;
        } else if (Array.isArray(errorResponse.message)) {
          message = errorResponse.message.join(', ');
        }
      } else if (typeof res === 'string') {
        message = res;
      }
    }

    // Nunca se manda el body/headers crudos — `SentryReporterService.captureException` sanitiza
    // el body/query reusando `ObservabilityModule.formatPayload` antes de salir del proceso.
    this.sentryReporter.captureException(exception, {
      route: request?.url,
      method: request?.method,
      requestId: extractRequestId(request),
      userId: request?.user?.id,
      body: request?.body,
      query: request?.query,
    });

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
