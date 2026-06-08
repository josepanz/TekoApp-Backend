import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { auditStorage } from '../database/services/prisma.service';
import { APPLICATION_NAME_KEY } from '@common/decorators/application-name.decorator';
import { Observable } from 'rxjs';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      user?: { email?: string };
      body?: Record<string, unknown>;
      query?: Record<string, unknown>;
      params?: Record<string, unknown>;
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    }>();

    const applicationName =
      this.reflector.getAllAndOverride<string>(APPLICATION_NAME_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'tekoapp-backend';

    const userIdRaw =
      request?.user?.email ??
      request?.body?.userEmail ??
      request?.query?.userEmail ??
      request?.params?.userEmail ??
      'system';
    const userId = typeof userIdRaw === 'string' ? userIdRaw : 'system';

    const ipRaw = request.ip ?? request.headers['x-forwarded-for'] ?? 'unknown';
    const ip = Array.isArray(ipRaw) ? (ipRaw[0] ?? 'unknown') : ipRaw;

    const userAgentRaw = request.headers['user-agent'] ?? 'unknown';
    const userAgent = Array.isArray(userAgentRaw)
      ? (userAgentRaw[0] ?? 'unknown')
      : userAgentRaw;

    const store = { userId, ip, userAgent, applicationName };

    return auditStorage.run(store, () => next.handle());
  }
}
