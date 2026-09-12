import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';

import { t } from '@common/i18n/i18n.helper';
const PERMISSIONS_KEY = 'permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // `getAllAndOverride` mira primero `context.getHandler()` (método) y, si no hay metadata ahí,
    // cae a `context.getClass()` (clase) — el handler siempre gana. Antes se leía solo el handler
    // con `reflector.get`, lo que dejaba un `@Permissions` de clase sin efecto (ver
    // openspec/decisions.md, hallazgo que expuso 5 endpoints admin, corregido en beb7e16).
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user: IUserDataOnJwt }>();

    if (!user || !user.permissions || !Array.isArray(user.permissions)) {
      throw new ForbiddenException(t('auth.NO_PERMISSIONS_ASSIGNED'));
    }

    const hasPermission = requiredPermissions.some((permission) =>
      user.permissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        t('auth.MISSING_REQUIRED_PERMISSIONS', {
          requiredPermissions: requiredPermissions.toString(),
        }),
      );
    }

    return hasPermission;
  }
}
