import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';

const mockGet = jest.fn();

function buildContext(user?: Partial<IUserDataOnJwt>): ExecutionContext {
  const request = { user };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => jest.fn(),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    const reflector = { get: mockGet } as unknown as Reflector;
    guard = new PermissionsGuard(reflector);
  });

  it('deja pasar el endpoint si no declara @Permissions', () => {
    // Arrange
    mockGet.mockReturnValue(undefined);

    // Act
    const result = guard.canActivate(buildContext(undefined));

    // Assert
    expect(result).toBe(true);
  });

  it('deja pasar si el usuario tiene alguno de los permisos requeridos', () => {
    // Arrange
    mockGet.mockReturnValue(['professionals.verification:manage', 'admin:all']);
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
    mockGet.mockReturnValue(['professionals.verification:manage', 'admin:all']);
    const context = buildContext({
      permissions: ['user:read'],
    });

    // Act & Assert
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('lanza ForbiddenException si el usuario no tiene permisos asignados', () => {
    // Arrange
    mockGet.mockReturnValue(['professionals.verification:manage', 'admin:all']);
    const context = buildContext(undefined);

    // Act & Assert
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
