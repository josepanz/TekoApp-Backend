import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { TipConfigController } from './tip-config.controller';
import { TipsService } from '../services/tips.service';

const mockGetConfig = jest.fn();

describe('TipConfigController', () => {
  let controller: TipConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TipConfigController],
      providers: [
        { provide: TipsService, useValue: { getConfig: mockGetConfig } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<TipConfigController>(TipConfigController);
  });

  afterEach(() => jest.clearAllMocks());

  it('debe retornar la config de propinas del service', async () => {
    // Arrange
    const expected = {
      isEnabled: true,
      isMandatory: false,
      suggestedPercentages: [10, 15, 20],
      allowFreeAmount: true,
    };
    mockGetConfig.mockResolvedValue(expected);

    // Act
    const result = await controller.getConfig();

    // Assert
    expect(result).toEqual(expected);
  });
});
