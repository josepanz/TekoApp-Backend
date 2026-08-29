import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MaterialQualityTier } from '@prisma/client';
import { MaterialCatalogService } from './material-catalog.service';
import { MaterialCatalogDbService } from '@modules/material-catalog-db/services/material-catalog-db.service';

const mockFindPaginated = jest.fn();
const mockFindByReferenceId = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();

describe('MaterialCatalogService', () => {
  let service: MaterialCatalogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialCatalogService,
        {
          provide: MaterialCatalogDbService,
          useValue: {
            findPaginated: mockFindPaginated,
            findByReferenceId: mockFindByReferenceId,
            create: mockCreate,
            update: mockUpdate,
          },
        },
      ],
    }).compile();

    service = module.get<MaterialCatalogService>(MaterialCatalogService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('debe delegar en el db service la paginación', async () => {
      // Arrange
      const paginated = {
        data: [],
        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
      };
      mockFindPaginated.mockResolvedValue(paginated);

      // Act
      const result = await service.list({ page: 1, pageSize: 10 });

      // Assert
      expect(result).toEqual(paginated);
    });
  });

  describe('create', () => {
    it('debe crear el ítem con el createdBy del usuario autenticado', async () => {
      // Arrange
      const dto = {
        categoryId: 1,
        name: 'Cerámica',
        unit: 'm2',
        qualityTier: MaterialQualityTier.STANDARD,
        defaultPrice: 45000,
      };
      const created = { id: 1, referenceId: 'item-1', ...dto };
      mockCreate.mockResolvedValue(created);

      // Act
      const result = await service.create(dto, 'staff-ref-1');

      // Assert
      expect(result).toEqual(created);
      expect(mockCreate).toHaveBeenCalledWith({
        ...dto,
        createdBy: 'staff-ref-1',
      });
    });
  });

  describe('update', () => {
    it('debe actualizar el ítem cuando existe', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue({ id: 1, referenceId: 'item-1' });
      mockUpdate.mockResolvedValue({ id: 1, isActive: false });

      // Act
      const result = await service.update(
        'item-1',
        { isActive: false },
        'staff-ref-1',
      );

      // Assert
      expect(result).toEqual({ id: 1, isActive: false });
      expect(mockUpdate).toHaveBeenCalledWith(1, {
        isActive: false,
        lastChangedBy: 'staff-ref-1',
      });
    });

    it('debe lanzar NotFoundException cuando el ítem no existe', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update('item-x', { isActive: false }, 'staff-ref-1'),
      ).rejects.toThrow(NotFoundException);
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
