import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
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
  implements NestInterceptor<T, Response<T> | StreamableFile>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T> | StreamableFile> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<{ url: string }>();
    const response = ctx.getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      map((data: T | StreamableFile) => {
        // Una descarga de archivo (ver FileDownloadInterceptor) ya resolvió `data` a un
        // StreamableFile antes de llegar acá — envolverlo en el sobre {success, data, ...}
        // rompería la respuesta binaria, Nest solo reconoce el StreamableFile como valor de
        // retorno de nivel superior.
        if (data instanceof StreamableFile) {
          return data;
        }
        return {
          success: response.statusCode >= 200 && response.statusCode < 300,
          data,
          message: t('common.SUCCESS'),
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}
