import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { Permissions } from '@common/decorators/permissions.decorator';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';

const mockGetAllAndOverride = jest.fn();

const HANDLER_TOKEN = { kind: 'handler' };
const CLASS_TOKEN = { kind: 'class' };

function buildContext(user?: Partial<IUserDataOnJwt>): ExecutionContext {
  const request = { user };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => HANDLER_TOKEN,
    getClass: () => CLASS_TOKEN,
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    const reflector = {
      getAllAndOverride: mockGetAllAndOverride,
    } as unknown as Reflector;
    guard = new PermissionsGuard(reflector);
  });

  it('deja pasar el endpoint si no declara @Permissions ni en el método ni en la clase', () => {
    // Arrange
    mockGetAllAndOverride.mockReturnValue(undefined);

    // Act
    const result = guard.canActivate(buildContext(undefined));

    // Assert
    expect(result).toBe(true);
  });

  it('deja pasar si el usuario tiene alguno de los permisos requeridos', () => {
    // Arrange
    mockGetAllAndOverride.mockReturnValue([
      'professionals.verification:manage',
      'admin:all',
    ]);
    const context = buildContext({
      permissions: ['admin:all'],
    });

    // Act
    const result = guard.canActivate(context);

    // Assert
    expect(result).toBe(true);
  });

  it('lanza ForbiddenException si el usuario no tiene ninguno de los permisos requeridos', () => {
    // Arrange
    mockGetAllAndOverride.mockReturnValue([
      'professionals.verification:manage',
      'admin:all',
    ]);
    const context = buildContext({
      permissions: ['user:read'],
    });

    // Act & Assert
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('lanza ForbiddenException si el usuario no tiene permisos asignados', () => {
    // Arrange
    mockGetAllAndOverride.mockReturnValue([
      'professionals.verification:manage',
      'admin:all',
    ]);
    const context = buildContext(undefined);

    // Act & Assert
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('consulta getAllAndOverride con el handler primero y la clase como fallback (precedencia del handler)', () => {
    // Arrange
    mockGetAllAndOverride.mockReturnValue(undefined);
    const context = buildContext(undefined);

    // Act
    guard.canActivate(context);

    // Assert
    expect(mockGetAllAndOverride).toHaveBeenCalledWith('permissions', [
      HANDLER_TOKEN,
      CLASS_TOKEN,
    ]);
  });
});

/**
 * Estos casos usan un `Reflector` REAL (no mockeado) sobre clases/métodos decorados de verdad
 * con `@Permissions`, para probar la precedencia handler > clase que documenta NestJS para
 * `getAllAndOverride` — no alcanza con mockear el retorno de `getAllAndOverride` porque esa
 * lógica de precedencia vive DENTRO del `Reflector`, no en `PermissionsGuard`.
 */
describe('PermissionsGuard — precedencia real de metadata (handler > clase)', () => {
  let guard: PermissionsGuard;

  beforeEach(() => {
    guard = new PermissionsGuard(new Reflector());
  });

  @Permissions('class:permission')
  class ControllerWithClassLevelOnly {
    sinDecorarPropio() {
      /* no-op */
    }
  }

  @Permissions('class:permission')
  class ControllerWithMethodOverride {
    @Permissions('method:permission')
    conDecoradorPropio() {
      /* no-op */
    }
  }

  class ControllerWithoutAnyPermissions {
    sinNada() {
      /* no-op */
    }
  }

  function buildRealContext(
    ControllerClass: new () => object,
    methodName: string,
    user?: Partial<IUserDataOnJwt>,
  ): ExecutionContext {
    const instance = new ControllerClass() as Record<string, () => void>;
    const request = { user };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => instance[methodName],
      getClass: () => ControllerClass,
    } as unknown as ExecutionContext;
  }

  it('un @Permissions de clase ahora SÍ se aplica cuando el método no tiene el suyo propio', () => {
    // Arrange — antes del fix, `reflector.get(KEY, context.getHandler())` no encontraba nada acá
    // y el guard fallaba abierto (`return true`) aunque la clase declarara el permiso.
    const context = buildRealContext(
      ControllerWithClassLevelOnly,
      'sinDecorarPropio',
      { permissions: ['user:read'] },
    );

    // Act & Assert — el usuario NO tiene 'class:permission', así que ahora debe ser rechazado.
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('el permiso de clase deja pasar a un usuario que sí lo tiene', () => {
    // Arrange
    const context = buildRealContext(
      ControllerWithClassLevelOnly,
      'sinDecorarPropio',
      { permissions: ['class:permission'] },
    );

    // Act
    const result = guard.canActivate(context);

    // Assert
    expect(result).toBe(true);
  });

  it('el @Permissions de método tiene precedencia sobre el de clase', () => {
    // Arrange — usuario con el permiso de CLASE pero no el de MÉTODO: debe ser rechazado,
    // porque getAllAndOverride usa el del método y descarta el de la clase.
    const context = buildRealContext(
      ControllerWithMethodOverride,
      'conDecoradorPropio',
      { permissions: ['class:permission'] },
    );

    // Act & Assert
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('con el permiso de método correcto, pasa aunque no tenga el de clase', () => {
    // Arrange
    const context = buildRealContext(
      ControllerWithMethodOverride,
      'conDecoradorPropio',
      { permissions: ['method:permission'] },
    );

    // Act
    const result = guard.canActivate(context);

    // Assert
    expect(result).toBe(true);
  });

  it('sin ningún @Permissions (ni método ni clase) sigue fallando abierto por diseño', () => {
    // Arrange — comportamiento intencional que no cambia: un endpoint sin decorar sigue sin
    // requerir permisos explícitos (ver PermissionsGuard.canActivate).
    const context = buildRealContext(
      ControllerWithoutAnyPermissions,
      'sinNada',
      undefined,
    );

    // Act
    const result = guard.canActivate(context);

    // Assert
    expect(result).toBe(true);
  });
});
