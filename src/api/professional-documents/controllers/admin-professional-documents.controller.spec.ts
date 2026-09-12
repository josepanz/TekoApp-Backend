import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { AdminProfessionalDocumentsController } from './admin-professional-documents.controller';
import { ProfessionalDocumentsService } from '../services/professional-documents.service';

const mockAdminQueue = jest.fn();
const mockAdminDocuments = jest.fn();
const mockReview = jest.fn();

/**
 * Regresión de seguridad (2026-09-11): los 3 endpoints de este controller estuvieron protegidos
 * SOLO por un `@Permissions` a nivel de clase, que `PermissionsGuard.canActivate` nunca lee (lee
 * únicamente `context.getHandler()`) — cualquier usuario logueado podía listar/leer documentos de
 * identidad y antecedentes, y aprobar o rechazar revisiones. Estos tests instancian el guard REAL
 * con un Reflector REAL contra el método REAL del controller (no mockean el Reflector) para que,
 * si alguna vez se borra el `@Permissions` de un método, el test falle con "esperaba 403 y no lo
 * tiró" en vez de solo verificar metadata presente.
 */
function buildContext(
  handler: (...args: unknown[]) => unknown,
  user?: Partial<IUserDataOnJwt>,
): ExecutionContext {
  return {
    getHandler: () => handler,
    // El guard ahora también consulta `getClass()` (getAllAndOverride) para que un
    // `@Permissions` de clase funcione como fallback — ver PermissionsGuard.
    getClass: () => AdminProfessionalDocumentsController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('AdminProfessionalDocumentsController', () => {
  let controller: AdminProfessionalDocumentsController;
  let guard: PermissionsGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProfessionalDocumentsController],
      providers: [
        {
          provide: ProfessionalDocumentsService,
          useValue: {
            adminQueue: mockAdminQueue,
            adminDocuments: mockAdminDocuments,
            review: mockReview,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AdminProfessionalDocumentsController>(
      AdminProfessionalDocumentsController,
    );
    guard = new PermissionsGuard(new Reflector());
  });

  afterEach(() => jest.clearAllMocks());

  describe.each([
    // eslint-disable-next-line @typescript-eslint/unbound-method -- solo se pasa la referencia al guard (getHandler), nunca se invoca desatada de la instancia
    ['queue', () => controller.queue],
    // eslint-disable-next-line @typescript-eslint/unbound-method -- idem
    ['byProfessional', () => controller.byProfessional],
    // eslint-disable-next-line @typescript-eslint/unbound-method -- idem
    ['review', () => controller.review],
  ] as const)('%s', (_name, getHandler) => {
    it('debe rechazar con 403 a un usuario sin professional-documents.review:manage ni admin:all', () => {
      // Arrange
      const context = buildContext(getHandler(), {
        permissions: ['user:read'],
      });

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('debe permitir el acceso con professional-documents.review:manage', () => {
      // Arrange
      const context = buildContext(getHandler(), {
        permissions: [PERMISSIONS.PROFESSIONAL_DOCUMENTS.REVIEW],
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

  it('debe delegar los documentos de un profesional al service', async () => {
    // Arrange
    mockAdminDocuments.mockResolvedValue({ data: [] });

    // Act
    await controller.byProfessional({ referenceId: 'prof-1' });

    // Assert
    expect(mockAdminDocuments).toHaveBeenCalledWith('prof-1');
  });

  it('debe delegar la revisión al service con los datos y el staff autenticado', async () => {
    // Arrange
    mockReview.mockResolvedValue({});
    const dto = { status: 'APPROVED', rejectionReason: undefined } as never;

    // Act
    await controller.review({ referenceId: 'doc-1' }, dto, {
      user: { referenceId: 'staff-ref' } as IUserDataOnJwt,
    });

    // Assert
    expect(mockReview).toHaveBeenCalledWith(
      'doc-1',
      'APPROVED',
      undefined,
      'staff-ref',
    );
  });
});
