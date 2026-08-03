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
    }

    const errorResponse = {
      success: false,
      error: {
        code: status,
        message,
        error,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    response.status(status).json(errorResponse);
  }
}
