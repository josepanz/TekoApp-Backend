import { Test, TestingModule } from '@nestjs/testing';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { CurrenciesDbService } from './currencies-db.service';

const mockCurrencyFindMany = jest.fn();
const mockCurrencyFindUnique = jest.fn();

const mockPrisma = {
  extended: {
    currency: {
      findMany: mockCurrencyFindMany,
      findUnique: mockCurrencyFindUnique,
    },
  },
};

const guarani = {
  alphaCode: 'PYG',
  numberCode: '600',
  decimalQuantity: 0,
  name: 'Guaraní paraguayo',
  symbol: '₲',
  countryId: 1,
  isActive: true,
};

describe('CurrenciesDbService', () => {
  let service: CurrenciesDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrenciesDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CurrenciesDbService>(CurrenciesDbService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAllActive', () => {
    it('debe retornar solo las monedas activas ordenadas por código', async () => {
      // Arrange
      mockCurrencyFindMany.mockResolvedValue([guarani]);

      // Act
      const result = await service.findAllActive();

      // Assert
      expect(result).toEqual([guarani]);
      expect(mockCurrencyFindMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { alphaCode: 'asc' },
      });
    });
  });

  describe('findByAlphaCode', () => {
    it('debe retornar la moneda cuando existe', async () => {
      // Arrange
      mockCurrencyFindUnique.mockResolvedValue(guarani);

      // Act
      const result = await service.findByAlphaCode('PYG');

      // Assert
      expect(result).toEqual(guarani);
      expect(mockCurrencyFindUnique).toHaveBeenCalledWith({
        where: { alphaCode: 'PYG' },
      });
    });

    it('debe retornar null cuando la moneda no existe', async () => {
      // Arrange
      mockCurrencyFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findByAlphaCode('XXX');

      // Assert
      expect(result).toBeNull();
    });
  });
});
