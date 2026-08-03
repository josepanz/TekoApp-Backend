import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CurrenciesController } from './currencies.controller';
import { CurrenciesService } from '@api/currencies/services/currencies.service';

const mockFindAll = jest.fn();
const mockFindOne = jest.fn();

describe('CurrenciesController', () => {
  let controller: CurrenciesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurrenciesController],
      providers: [
        {
          provide: CurrenciesService,
          useValue: { findAll: mockFindAll, findOne: mockFindOne },
        },
      ],
    }).compile();

    controller = module.get<CurrenciesController>(CurrenciesController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('debe retornar la lista de monedas', async () => {
      // Arrange
      const currencies = [{ alphaCode: 'PYG', name: 'Guaraní paraguayo' }];
      mockFindAll.mockResolvedValue(currencies);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toEqual(currencies);
      expect(mockFindAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debe retornar la moneda solicitada por su código', async () => {
      // Arrange
      const currency = { alphaCode: 'PYG', name: 'Guaraní paraguayo' };
      mockFindOne.mockResolvedValue(currency);

      // Act
      const result = await controller.findOne({ alphaCode: 'PYG' });

      // Assert
      expect(result).toEqual(currency);
      expect(mockFindOne).toHaveBeenCalledWith('PYG');
    });

    it('debe propagar NotFoundException cuando la moneda no existe', async () => {
      // Arrange
      mockFindOne.mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(controller.findOne({ alphaCode: 'XXX' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
