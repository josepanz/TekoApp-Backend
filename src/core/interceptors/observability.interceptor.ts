import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { PinoLogger } from 'nestjs-pino';
import { Request } from 'express';
import { TRACE_ID_HEADER } from '@core/middlewares/trace-id.middleware';
import { formatPayload } from '@modules/observability/observability.module';

const SERVER_ERROR_MIN: number = HttpStatus.INTERNAL_SERVER_ERROR;

/** DEF-BE-031: 4xx (y otros no-2xx por debajo de 500) es WARN; solo 5xx es ERROR. */
export const levelFor = (statusCode: number): 'warn' | 'error' =>
  statusCode >= SERVER_ERROR_MIN ? 'error' : 'warn';

@Injectable()
export class ObservabilityInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    this.logger.info(
      {
        request: req?.body ? formatPayload(req?.body) : undefined,
      },
      `Incoming | ${req.method} ${req.url} | Trace ID: ${req[TRACE_ID_HEADER]}`,
    );

    return next.handle().pipe(
      tap((responseBody: unknown) => {
        const latency = Date.now() - now;
        const res = ctx.getResponse<{ statusCode: HttpStatus }>();
        const statusCode = res.statusCode;
        const statusName =
          Object.entries(HttpStatus).find(
            ([, value]) => value === statusCode,
          )?.[0] ?? 'UNKNOWN';
        if (statusCode >= HttpStatus.OK && statusCode < HttpStatus.AMBIGUOUS) {
          this.logger.info(
            {
              response:
                responseBody != undefined
                  ? formatPayload(responseBody)
                  : undefined,
              latencyMs: latency,
            },
            `Success | ${req.method} ${req.url} - (${statusCode} - ${statusName}) | Trace ID: ${req[TRACE_ID_HEADER]}`,
          );
        } else {
          this.logger[levelFor(statusCode)](
            {
              response:
                responseBody != undefined
                  ? formatPayload(responseBody)
                  : undefined,
              latencyMs: latency,
            },
            `Not OK | ${req.method} ${req.url} - (${statusCode} - ${statusName}) | Trace ID: ${req[TRACE_ID_HEADER]}`,
          );
        }
      }),
      catchError((error: unknown) => {
        const latency = Date.now() - now;
        // DEF-BE-031: en este punto el filtro de excepciones todavía no corrió, así que
        // `res.statusCode` conserva el default del handler (201 en un POST). El status real es el de
        // la excepción: HttpException trae el suyo, cualquier otra cosa terminará en 500.
        const statusCode: number =
          error instanceof HttpException
            ? error.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
        const statusName =
          Object.entries(HttpStatus).find(
            ([, value]) => Number(value) === statusCode,
          )?.[0] ?? 'UNKNOWN';
        const isServerError = statusCode >= SERVER_ERROR_MIN;
        // 4xx manejado (validación, 409, 403...) es una respuesta correcta del contrato: WARN, sin
        // stack. Solo un 5xx es ERROR con stack.
        this.logger[levelFor(statusCode)](
          {
            error: error instanceof Error ? error.message : 'Error desconocido',
            stack:
              isServerError && error instanceof Error ? error.stack : undefined,
            latencyMs: latency,
          },
          `Error | ${req.method} ${req.url} - (${statusCode} - ${statusName}) | Trace ID: ${req[TRACE_ID_HEADER]}`,
        );
        return throwError(() => error);
      }),
    );
  }
}
