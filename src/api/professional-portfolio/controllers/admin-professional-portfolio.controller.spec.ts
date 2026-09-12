import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { AdminProfessionalPortfolioController } from './admin-professional-portfolio.controller';
import { ProfessionalPortfolioService } from '../services/professional-portfolio.service';

const mockAdminQueue = jest.fn();
const mockReview = jest.fn();

/**
 * Regresión de seguridad (2026-09-11): los 2 endpoints de este controller estuvieron protegidos
 * SOLO por un `@Permissions` a nivel de clase, que `PermissionsGuard.canActivate` nunca lee (lee
 * únicamente `context.getHandler()`) — cualquier usuario logueado podía listar la cola de revisión
 * y aprobar/rechazar fotos de portafolio, incluso las propias. Estos tests instancian el guard
 * REAL con un Reflector REAL contra el método REAL del controller (no mockean el Reflector) para
 * que, si alguna vez se borra el `@Permissions` de un método, el test falle con "esperaba 403 y no
 * lo tiró" en vez de solo verificar metadata presente.
 */
function buildContext(
  handler: (...args: unknown[]) => unknown,
  user?: Partial<IUserDataOnJwt>,
): ExecutionContext {
  return {
    getHandler: () => handler,
    // El guard ahora también consulta `getClass()` (getAllAndOverride) para que un
    // `@Permissions` de clase funcione como fallback — ver PermissionsGuard.
    getClass: () => AdminProfessionalPortfolioController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('AdminProfessionalPortfolioController', () => {
  let controller: AdminProfessionalPortfolioController;
  let guard: PermissionsGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProfessionalPortfolioController],
      providers: [
        {
          provide: ProfessionalPortfolioService,
          useValue: { adminQueue: mockAdminQueue, review: mockReview },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AdminProfessionalPortfolioController>(
      AdminProfessionalPortfolioController,
    );
    guard = new PermissionsGuard(new Reflector());
  });

  afterEach(() => jest.clearAllMocks());

  describe.each([
    // eslint-disable-next-line @typescript-eslint/unbound-method -- solo se pasa la referencia al guard (getHandler), nunca se invoca desatada de la instancia
    ['queue', () => controller.queue],
    // eslint-disable-next-line @typescript-eslint/unbound-method -- idem
    ['review', () => controller.review],
  ] as const)('%s', (_name, getHandler) => {
    it('debe rechazar con 403 a un usuario sin professional-portfolio.review:manage ni admin:all', () => {
      // Arrange
      const context = buildContext(getHandler(), {
        permissions: ['user:read'],
      });

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('debe permitir el acceso con professional-portfolio.review:manage', () => {
      // Arrange
      const context = buildContext(getHandler(), {
        permissions: [PERMISSIONS.PROFESSIONAL_PORTFOLIO.REVIEW],
      });

      // Act & Assert
      expect(guard.canActivate(context)).toBe(true);
    });

    it('debe permitir el acceso con admin:all', () => {
      // Arrange
      const context = buildContext(getHandler(), {
        permissions: [PERMISSIONS.ADMIN.ALL],
      });

      // Act & Assert
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  it('debe delegar la cola al service con el query recibido', async () => {
    // Arrange
    mockAdminQueue.mockResolvedValue({ data: [] });

    // Act
    await controller.queue({});

    // Assert
    expect(mockAdminQueue).toHaveBeenCalledWith({});
  });

  it('debe delegar la revisión al service con los datos y el staff autenticado', async () => {
    // Arrange
    mockReview.mockResolvedValue({});
    const dto = { status: 'APPROVED', rejectionReason: undefined } as never;

    // Act
    await controller.review({ referenceId: 'item-1' }, dto, {
      user: { referenceId: 'staff-ref' } as IUserDataOnJwt,
    });

    // Assert
    expect(mockReview).toHaveBeenCalledWith(
      'item-1',
      'APPROVED',
      undefined,
      'staff-ref',
    );
  });
});
