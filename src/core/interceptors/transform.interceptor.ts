import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { t } from '@common/i18n/i18n.helper';

export interface Response<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  path: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<{ url: string }>();
    const response = ctx.getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      map((data: T) => ({
        success: response.statusCode >= 200 && response.statusCode < 300,
        data,
        message: t('common.SUCCESS'),
        timestamp: new Date().toISOString(),
        path: request.url,
      })),
    );
  }
}
