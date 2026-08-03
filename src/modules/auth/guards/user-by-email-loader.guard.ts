import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { UsersDBService } from '@modules/users-db/services/users-db.service';
import { Users } from '@prisma/client';

import { t } from '@common/i18n/i18n.helper';
@Injectable()
export class UserByEmailLoaderGuard implements CanActivate {
  constructor(private readonly usersService: UsersDBService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<ExpressRequest & { user?: unknown }>();
    const body = request.body as Record<string, unknown> | undefined;
    const query = request.query as Record<string, unknown> | undefined;

    if (!body?.email && !query?.email) {
      throw new BadRequestException(t('auth.EMAIL_FIELD_REQUIRED'));
    }

    const email: string = (body?.email ?? query?.email) as string;

    const fullUser: Users | null =
      await this.usersService.findActiveUserByEmail(email);

    if (!fullUser) {
      throw new NotFoundException(
        t('auth.USER_NOT_FOUND_OR_INACTIVE_FOR_EMAIL'),
      );
    }

    request.user = fullUser;

    return true;
  }
}
