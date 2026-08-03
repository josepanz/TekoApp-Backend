import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CountriesController } from './countries.controller';
import { CountriesService } from '@api/countries/services/countries.service';
import { GetCountriesListQueryDTO } from '../dtos/request';

const mockFindAll = jest.fn();
const mockFindOne = jest.fn();

describe('CountriesController', () => {
  let controller: CountriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CountriesController],
      providers: [
        {
          provide: CountriesService,
          useValue: { findAll: mockFindAll, findOne: mockFindOne },
        },
      ],
    }).compile();

    controller = module.get<CountriesController>(CountriesController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('debe retornar el listado paginado de países', async () => {
      // Arrange
      const response = {
        data: [{ id: 1, commonName: 'Paraguay' }],
        pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
      };
      mockFindAll.mockResolvedValue(response);
      const query = { page: 1, pageSize: 10 } as GetCountriesListQueryDTO;

      // Act
      const result = await controller.findAll(query);

      // Assert
      expect(result).toEqual(response);
      expect(mockFindAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('debe retornar el país solicitado', async () => {
      // Arrange
      const country = { id: 1, commonName: 'Paraguay' };
      mockFindOne.mockResolvedValue(country);

      // Act
      const result = await controller.findOne({ id: 1 });

      // Assert
      expect(result).toEqual(country);
      expect(mockFindOne).toHaveBeenCalledWith(1);
    });

    it('debe propagar NotFoundException cuando el país no existe', async () => {
      // Arrange
      mockFindOne.mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(controller.findOne({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
