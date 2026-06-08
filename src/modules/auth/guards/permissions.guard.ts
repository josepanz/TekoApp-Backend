import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';

const PERMISSIONS_KEY = 'permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user: IUserDataOnJwt }>();

    if (!user || !user.permissions || !Array.isArray(user.permissions)) {
      throw new ForbiddenException(`Usuario sin permisos asignados.`);
    }

    const hasPermission = requiredPermissions.some((permission) =>
      user.permissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Usuario no tiene los permisos necesarios: ${requiredPermissions.toString()}.`,
      );
    }

    return hasPermission;
  }
}
