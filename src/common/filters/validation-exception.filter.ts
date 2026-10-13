import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { STATUS_CODES } from 'http';
import { Request, Response } from 'express';

import { t } from '@common/i18n/i18n.helper';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = t('validation.VALIDATION_ERROR');
    let errors = [];

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      if ('message' in exceptionResponse) {
        if (Array.isArray(exceptionResponse.message)) {
          errors = exceptionResponse.message;
          message = t('validation.MULTIPLE_VALIDATION_ERRORS');
        } else {
          message = exceptionResponse.message as string;
        }
      }
    }

    const errorResponse = {
      success: false,
      error: {
        code: status,
        message,
        error: STATUS_CODES[status] ?? 'Bad Request',
        errors,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    response.status(status).json(errorResponse);
  }
}
