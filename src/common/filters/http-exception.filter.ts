import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { t } from '@common/i18n/i18n.helper';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = t('common.INTERNAL_SERVER_ERROR');
    let error = 'Internal Server Error';
    // `errorCode` es un identificador MÁQUINA-legible opcional (ej. `CONSENT_REQUIRED`,
    // `LEGAL_HOLD_ACTIVE`) — a diferencia de `message` (texto humano, cambia con el idioma) y
    // `error` (nombre genérico de la excepción HTTP, ej. "Forbidden"), este campo es estable y
    // pensado para que un cliente (Mobile/Web) rame en un `switch` sin parsear el mensaje.
    // Opcional: la mayoría de las excepciones no lo setean y el campo se omite del JSON.
    let errorCode: string | undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      if ('message' in resp) {
        const raw = resp['message'];
        message = Array.isArray(raw)
          ? typeof raw[0] === 'string'
            ? raw[0]
            : message
          : typeof raw === 'string'
            ? raw
            : message;
      }
      if ('error' in resp) {
        const raw = resp['error'];
        error = typeof raw === 'string' ? raw : error;
      }
      if ('errorCode' in resp) {
        const raw = resp['errorCode'];
        errorCode = typeof raw === 'string' ? raw : undefined;
      }
    }

    const errorResponse = {
      success: false,
      error: {
        code: status,
        message,
        error,
        ...(errorCode ? { errorCode } : {}),
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    response.status(status).json(errorResponse);
  }
}
