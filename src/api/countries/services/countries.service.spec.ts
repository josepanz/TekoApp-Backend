import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CountriesDbService } from '@modules/countries-db/services/countries-db.service';
import { CountriesService } from './countries.service';
import { GetCountriesListQueryDTO } from '../dtos/request';

const mockFindPaginated = jest.fn();
const mockFindById = jest.fn();

const paraguay = {
  id: 1,
  commonName: 'Paraguay',
  officialName: 'República del Paraguay',
  iso2: 'PY',
  iso3: 'PRY',
  numericCode: '600',
  phonePrefixCode: '+595',
  observations: null,
  isActive: true,
};

describe('CountriesService', () => {
  let service: CountriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountriesService,
        {
          provide: CountriesDbService,
          useValue: {
            findPaginated: mockFindPaginated,
            findById: mockFindById,
          },
        },
      ],
    }).compile();

    service = module.get<CountriesService>(CountriesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('debe retornar el listado paginado de países', async () => {
      // Arrange
      const pagination = { total: 1, page: 1, pageSize: 10, totalPages: 1 };
      mockFindPaginated.mockResolvedValue({ data: [paraguay], pagination });
      const query = { page: 1, pageSize: 10 } as GetCountriesListQueryDTO;

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(result.data).toEqual([paraguay]);
      expect(result.pagination).toEqual(pagination);
      expect(mockFindPaginated).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('debe retornar el país cuando existe', async () => {
      // Arrange
      mockFindById.mockResolvedValue(paraguay);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result).toEqual(paraguay);
    });

    it('debe lanzar NotFoundException cuando el país no existe', async () => {
      // Arrange
      mockFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
