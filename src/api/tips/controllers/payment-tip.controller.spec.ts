import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { TipMode } from '@prisma/client';
import { PaymentTipController } from './payment-tip.controller';
import { TipsService } from '../services/tips.service';

const mockCreateTip = jest.fn();
const mockGetTip = jest.fn();

const mockReq = { user: { id: 1 } };
const mockParam = { id: 'pay-uuid-1' };

describe('PaymentTipController', () => {
  let controller: PaymentTipController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentTipController],
      providers: [
        {
          provide: TipsService,
          useValue: { createTip: mockCreateTip, getTip: mockGetTip },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<PaymentTipController>(PaymentTipController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('debe crear la propina pasando el userId del token', async () => {
      // Arrange
      const dto = { mode: TipMode.PERCENTAGE, percentage: 10 };
      const expected = { referenceId: 'tip-uuid-1' };
      mockCreateTip.mockResolvedValue(expected);

      // Act
      const result = await controller.create(mockParam, mockReq, dto);

      // Assert
      expect(result).toEqual(expected);
      expect(mockCreateTip).toHaveBeenCalledWith('pay-uuid-1', 1, dto);
    });
  });

  describe('get', () => {
    it('debe retornar la propina del pago', async () => {
      // Arrange
      const expected = { referenceId: 'tip-uuid-1' };
      mockGetTip.mockResolvedValue(expected);

      // Act
      const result = await controller.get(mockParam);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetTip).toHaveBeenCalledWith('pay-uuid-1');
    });
  });
});
