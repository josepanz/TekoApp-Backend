import { Test, TestingModule } from '@nestjs/testing';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PrismaPaginationUtil } from '@common/utils/prisma-pagination.util';
import { CountriesDbService } from './countries-db.service';

// ─── Mock de PrismaPaginationUtil ─────────────────────────────────────────────
jest.mock('@common/utils/prisma-pagination.util');
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockPaginate = PrismaPaginationUtil.paginate as jest.MockedFunction<
  typeof PrismaPaginationUtil.paginate
>;

const mockCountryFindUnique = jest.fn();

const mockPrisma = {
  extended: {
    country: {
      findUnique: mockCountryFindUnique,
    },
  },
};

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

describe('CountriesDbService', () => {
  let service: CountriesDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountriesDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CountriesDbService>(CountriesDbService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findPaginated', () => {
    it('debe delegar en PrismaPaginationUtil filtrando solo países activos', async () => {
      // Arrange
      const paginated = {
        data: [paraguay],
        pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
      };
      mockPaginate.mockResolvedValue(paginated);

      // Act
      const result = await service.findPaginated({ page: 1, pageSize: 10 });

      // Assert
      expect(result).toEqual(paginated);
      expect(mockPaginate).toHaveBeenCalledWith(
        mockPrisma.extended.country,
        { page: 1, pageSize: 10 },
        expect.objectContaining({
          where: { isActive: true },
          defaultOrderByField: 'commonName',
        }),
      );
    });
  });

  describe('findById', () => {
    it('debe retornar el país cuando existe', async () => {
      // Arrange
      mockCountryFindUnique.mockResolvedValue(paraguay);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(result).toEqual(paraguay);
      expect(mockCountryFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('debe retornar null cuando el país no existe', async () => {
      // Arrange
      mockCountryFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });
});
