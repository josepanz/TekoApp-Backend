import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { PinoLogger } from 'nestjs-pino';
import { Request } from 'express';
import { TRACE_ID_HEADER } from '@core/middlewares/trace-id.middleware';
import { formatPayload } from '@modules/observability/observability.module';

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
          this.logger.error(
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
        const res = ctx.getResponse<{ statusCode: HttpStatus }>();
        const statusCode = res.statusCode;
        const statusName =
          Object.entries(HttpStatus).find(
            ([, value]) => value === statusCode,
          )?.[0] ?? 'UNKNOWN';
        this.logger.error(
          {
            error: error instanceof Error ? error.message : 'Error desconocido',
            stack: error instanceof Error ? error.stack : undefined,
            latencyMs: latency,
          },
          `Error | ${req.method} ${req.url} - (${statusCode} - ${statusName}) | Trace ID: ${req[TRACE_ID_HEADER]}`,
        );
        return throwError(() => error);
      }),
    );
  }
}
