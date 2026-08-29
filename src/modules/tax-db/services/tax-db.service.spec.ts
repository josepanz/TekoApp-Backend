import { Test, TestingModule } from '@nestjs/testing';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { TaxDbService } from './tax-db.service';

const mockTaxConfigFindFirst = jest.fn();

const mockPrisma = {
  extended: {
    taxConfig: {
      findFirst: mockTaxConfigFindFirst,
    },
  },
};

describe('TaxDbService', () => {
  let service: TaxDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TaxDbService>(TaxDbService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findActiveConfig', () => {
    it('debe resolver la config activa más reciente para el país dado', async () => {
      // Arrange
      const config = { id: 1, countryId: null, isEnabled: false, rate: 0 };
      mockTaxConfigFindFirst.mockResolvedValue(config);

      // Act
      const result = await service.findActiveConfig(null);

      // Assert
      expect(result).toEqual(config);
      expect(mockTaxConfigFindFirst).toHaveBeenCalledWith({
        where: { countryId: null, isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('debe retornar null cuando nunca se cargó ninguna config', async () => {
      // Arrange
      mockTaxConfigFindFirst.mockResolvedValue(null);

      // Act
      const result = await service.findActiveConfig();

      // Assert
      expect(result).toBeNull();
    });
  });
});
