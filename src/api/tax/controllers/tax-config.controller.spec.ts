import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { TaxConfigController } from './tax-config.controller';
import { TaxService } from '../services/tax.service';

const mockGetConfig = jest.fn();

describe('TaxConfigController', () => {
  let controller: TaxConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxConfigController],
      providers: [
        { provide: TaxService, useValue: { getConfig: mockGetConfig } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<TaxConfigController>(TaxConfigController);
  });

  afterEach(() => jest.clearAllMocks());

  it('debe retornar la config de impuestos del service', async () => {
    // Arrange
    const expected = { isEnabled: false, name: 'Sin configurar', rate: 0 };
    mockGetConfig.mockResolvedValue(expected);

    // Act
    const result = await controller.getConfig();

    // Assert
    expect(result).toEqual(expected);
  });
});
