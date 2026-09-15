import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { PERMISSIONS_KEY } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { DisputeResolution } from '@prisma/client';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { AdminDisputesController } from './admin-disputes.controller';
import { PaymentDisputesService } from '../services/payment-disputes.service';

const mockListQueue = jest.fn();
const mockClaim = jest.fn();
const mockResolve = jest.fn();

const fakeUser = { user: { id: 99 } as IUserDataOnJwt };

describe('AdminDisputesController', () => {
  let controller: AdminDisputesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDisputesController],
      providers: [
        {
          provide: PaymentDisputesService,
          useValue: {
            listQueue: mockListQueue,
            claim: mockClaim,
            resolve: mockResolve,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AdminDisputesController>(AdminDisputesController);
  });

  afterEach(() => jest.clearAllMocks());

  // `PermissionsGuard` solo lee metadata de `context.getHandler()` (nunca de la clase) — un
  // `@Permissions()` puesto a nivel de clase no haría nada en silencio. Por eso se verifica
  // método por método, mismo criterio que `AdminPaymentsController`.
  it.each([
    ['listQueue', 'listQueue'],
    ['claim', 'claim'],
    ['resolve', 'resolve'],
  ] as const)(
    'debe exigir disputes.adjudication:manage o admin:all en %s',
    (_label, method) => {
      // Arrange & Act
      const requiredPermissions = new Reflector().get<string[]>(
        PERMISSIONS_KEY,
        // eslint-disable-next-line @typescript-eslint/unbound-method -- solo se lee su metadata, nunca se invoca desatado de la instancia
        controller[method],
      );

      // Assert
      expect(requiredPermissions).toEqual([
        PERMISSIONS.DISPUTES.ADJUDICATE,
        PERMISSIONS.ADMIN.ALL,
      ]);
    },
  );

  it('debe delegar el listado de la cola al service', async () => {
    // Arrange
    mockListQueue.mockResolvedValue({ data: [], pagination: {} });

    // Act
    await controller.listQueue({});

    // Assert
    expect(mockListQueue).toHaveBeenCalledWith({});
  });

  it('debe delegar el claim con el referenceId y el id del staff', async () => {
    // Arrange
    mockClaim.mockResolvedValue({ referenceId: 'dsp-1' });

    // Act
    await controller.claim({ referenceId: 'dsp-1' }, fakeUser);

    // Assert
    expect(mockClaim).toHaveBeenCalledWith('dsp-1', 99);
  });

  it('debe delegar la resolución con el dto y el id del staff', async () => {
    // Arrange
    const dto = {
      resolution: DisputeResolution.NO_REFUND,
      resolutionNotes: 'improcedente',
    };
    mockResolve.mockResolvedValue({ referenceId: 'dsp-1' });

    // Act
    await controller.resolve({ referenceId: 'dsp-1' }, dto, fakeUser);

    // Assert
    expect(mockResolve).toHaveBeenCalledWith('dsp-1', 99, dto);
  });
});
