import { Test, TestingModule } from '@nestjs/testing';
import { MaterialQualityTier } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PrismaPaginationUtil } from '@common/utils/prisma-pagination.util';
import { MaterialCatalogDbService } from './material-catalog-db.service';

jest.mock('@common/utils/prisma-pagination.util');
// eslint-disable-next-line @typescript-eslint/unbound-method -- static method mockeado por jest.mock, nunca se invoca desatado de la clase
const mockPaginate = jest.mocked(PrismaPaginationUtil.paginate);

const mockFindUnique = jest.fn();
const mockFindMany = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();

const mockPrisma = {
  extended: {
    materialCatalog: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      create: mockCreate,
      update: mockUpdate,
    },
  },
};

describe('MaterialCatalogDbService', () => {
  let service: MaterialCatalogDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialCatalogDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MaterialCatalogDbService>(MaterialCatalogDbService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findPaginated', () => {
    it('delega en PrismaPaginationUtil sobre el modelo materialCatalog', async () => {
      // Arrange
      mockPaginate.mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
      });

      // Act
      await service.findPaginated({ page: 1, pageSize: 10 });

      // Assert
      expect(mockPaginate).toHaveBeenCalledWith(
        mockPrisma.extended.materialCatalog,
        { page: 1, pageSize: 10 },
        expect.objectContaining({ defaultOrderByField: 'name' }),
      );
    });
  });

  describe('findByReferenceId', () => {
    it('debe buscar por referenceId', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue({ id: 1, referenceId: 'item-1' });

      // Act
      const result = await service.findByReferenceId('item-1');

      // Assert
      expect(result).toEqual({ id: 1, referenceId: 'item-1' });
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { referenceId: 'item-1' },
      });
    });
  });

  describe('findManyByReferenceIds', () => {
    it('debe buscar todos los ítems cuyo referenceId esté en la lista', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);

      // Act
      await service.findManyByReferenceIds(['item-1', 'item-2']);

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { referenceId: { in: ['item-1', 'item-2'] } },
      });
    });
  });

  describe('create', () => {
    it('debe crear el ítem con los datos provistos', async () => {
      // Arrange
      const data = {
        categoryId: 1,
        name: 'Cerámica',
        unit: 'm2',
        qualityTier: MaterialQualityTier.STANDARD,
        defaultPrice: 45000,
        createdBy: 'staff-1',
      };
      mockCreate.mockResolvedValue({ id: 1, ...data });

      // Act
      const result = await service.create(data);

      // Assert
      expect(result).toEqual({ id: 1, ...data });
      expect(mockCreate).toHaveBeenCalledWith({ data });
    });
  });

  describe('update', () => {
    it('debe actualizar el ítem indicado', async () => {
      // Arrange
      mockUpdate.mockResolvedValue({ id: 1, isActive: false });

      // Act
      const result = await service.update(1, { isActive: false });

      // Assert
      expect(result).toEqual({ id: 1, isActive: false });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: false },
      });
    });
  });
});
