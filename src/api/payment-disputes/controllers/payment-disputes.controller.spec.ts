import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { DisputeReason } from '@prisma/client';
import { PaymentDisputesController } from './payment-disputes.controller';
import { PaymentDisputesService } from '../services/payment-disputes.service';

const mockOpenDispute = jest.fn();
const mockListForPayment = jest.fn();
const mockWithdraw = jest.fn();

const fakeUser = { user: { id: 1, referenceId: 'user-ref' } as IUserDataOnJwt };

describe('PaymentDisputesController', () => {
  let controller: PaymentDisputesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentDisputesController],
      providers: [
        {
          provide: PaymentDisputesService,
          useValue: {
            openDispute: mockOpenDispute,
            listForPayment: mockListForPayment,
            withdraw: mockWithdraw,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<PaymentDisputesController>(
      PaymentDisputesController,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('debe delegar la apertura de disputa al service con el usuario autenticado', async () => {
    // Arrange
    const dto = { reason: DisputeReason.OTHER, description: 'x'.repeat(15) };
    mockOpenDispute.mockResolvedValue({ referenceId: 'dsp-1' });

    // Act
    await controller.openDispute({ id: 'pay-1' }, dto, fakeUser);

    // Assert
    expect(mockOpenDispute).toHaveBeenCalledWith('pay-1', 1, 'user-ref', dto);
  });

  it('debe delegar el listado al service con el usuario completo (para el chequeo de staff)', async () => {
    // Arrange
    mockListForPayment.mockResolvedValue({ data: [] });

    // Act
    await controller.listForPayment({ id: 'pay-1' }, fakeUser);

    // Assert
    expect(mockListForPayment).toHaveBeenCalledWith('pay-1', fakeUser.user);
  });

  it('debe delegar el retiro al service con ambos referenceId y el usuario', async () => {
    // Arrange
    mockWithdraw.mockResolvedValue({ referenceId: 'dsp-1' });

    // Act
    await controller.withdraw(
      { id: 'pay-1' },
      { referenceId: 'dsp-1' },
      fakeUser,
    );

    // Assert
    expect(mockWithdraw).toHaveBeenCalledWith('pay-1', 'dsp-1', 1);
  });
});
