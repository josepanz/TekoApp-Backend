import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CurrenciesDbService } from '@modules/currencies-db/services/currencies-db.service';
import { CurrenciesService } from './currencies.service';

const mockFindAllActive = jest.fn();
const mockFindByAlphaCode = jest.fn();

const guarani = {
  alphaCode: 'PYG',
  numberCode: '600',
  decimalQuantity: 0,
  name: 'Guaraní paraguayo',
  symbol: '₲',
  countryId: 1,
  isActive: true,
};

describe('CurrenciesService', () => {
  let service: CurrenciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrenciesService,
        {
          provide: CurrenciesDbService,
          useValue: {
            findAllActive: mockFindAllActive,
            findByAlphaCode: mockFindByAlphaCode,
          },
        },
      ],
    }).compile();

    service = module.get<CurrenciesService>(CurrenciesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('debe retornar las monedas activas', async () => {
      // Arrange
      mockFindAllActive.mockResolvedValue([guarani]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([guarani]);
    });
  });

  describe('findOne', () => {
    it('debe retornar la moneda cuando existe', async () => {
      // Arrange
      mockFindByAlphaCode.mockResolvedValue(guarani);

      // Act
      const result = await service.findOne('PYG');

      // Assert
      expect(result).toEqual(guarani);
    });

    it('debe lanzar NotFoundException cuando la moneda no existe', async () => {
      // Arrange
      mockFindByAlphaCode.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('XXX')).rejects.toThrow(NotFoundException);
    });
  });
});
