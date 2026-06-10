import { Test, TestingModule } from '@nestjs/testing';
import { CategoryStatus } from '@prisma/client';
import { PrismaDatasource } from '@/core/database/services/prisma.service';
import { CategoriesDbService } from './categories-db.service';

// ── Mocks a nivel de módulo ────────────────────────────────────────────────
const mockCreate = jest.fn();
const mockFindUnique = jest.fn();
const mockFindFirst = jest.fn();
const mockFindMany = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockCount = jest.fn();

const mockPrisma = {
  category: {
    create: mockCreate,
    findUnique: mockFindUnique,
    findFirst: mockFindFirst,
    findMany: mockFindMany,
    update: mockUpdate,
    delete: mockDelete,
    count: mockCount,
  },
};

// ── Fixtures ───────────────────────────────────────────────────────────────
const baseCategory = {
  id: 1,
  name: 'Plomería',
  description: 'Servicios de plomería',
  status: CategoryStatus.ACTIVE,
  isVisible: true,
  sortOrder: 0,
  parentCategoryId: null,
};

describe('CategoriesDbService', () => {
  let service: CategoriesDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CategoriesDbService>(CategoriesDbService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ─────────────────────────────────────────────────────────────
  describe('create', () => {
    it('debe retornar la categoría creada con los datos provistos', async () => {
      // Arrange
      const input = {
        name: 'Plomería',
        slug: 'plomeria',
        description: 'Servicios de plomería',
      } as never;
      mockCreate.mockResolvedValue(baseCategory);

      // Act
      const result = await service.create(input);

      // Assert
      expect(result).toEqual(baseCategory);
      expect(mockCreate).toHaveBeenCalledWith({ data: input });
    });
  });

  // ── findUnique ─────────────────────────────────────────────────────────
  describe('findUnique', () => {
    it('debe retornar la categoría con sus relaciones cuando existe', async () => {
      // Arrange
      const categoryWithRelations = {
        ...baseCategory,
        professionals: [],
        services: [],
      };
      mockFindUnique.mockResolvedValue(categoryWithRelations);

      // Act
      const result = await service.findUnique({ id: 1 });

      // Assert
      expect(result).toEqual(categoryWithRelations);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { professionals: true, services: true },
      });
    });

    it('debe retornar null cuando la categoría no existe', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findUnique({ id: 999 });

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── findFirst ──────────────────────────────────────────────────────────
  describe('findFirst', () => {
    it('debe retornar la primera categoría que coincide con el filtro', async () => {
      // Arrange
      mockFindFirst.mockResolvedValue(baseCategory);

      // Act
      const result = await service.findFirst({ name: 'Plomería' });

      // Assert
      expect(result).toEqual(baseCategory);
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: { name: 'Plomería' },
      });
    });

    it('debe retornar null cuando ninguna categoría coincide', async () => {
      // Arrange
      mockFindFirst.mockResolvedValue(null);

      // Act
      const result = await service.findFirst({ name: 'Inexistente' });

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── findMany ───────────────────────────────────────────────────────────
  describe('findMany', () => {
    it('debe retornar la lista de categorías con los args proporcionados', async () => {
      // Arrange
      const categories = [
        baseCategory,
        { ...baseCategory, id: 2, name: 'Electricidad' },
      ];
      mockFindMany.mockResolvedValue(categories);
      const args = { where: { status: CategoryStatus.ACTIVE } };

      // Act
      const result = await service.findMany(args);

      // Assert
      expect(result).toEqual(categories);
      expect(mockFindMany).toHaveBeenCalledWith(args);
    });

    it('debe retornar lista vacía cuando no hay categorías que coincidan', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);

      // Act
      const result = await service.findMany();

      // Assert
      expect(result).toEqual([]);
    });
  });

  // ── update ─────────────────────────────────────────────────────────────
  describe('update', () => {
    it('debe retornar la categoría actualizada con los nuevos datos', async () => {
      // Arrange
      const updated = { ...baseCategory, name: 'Plomería General' };
      mockUpdate.mockResolvedValue(updated);

      // Act
      const result = await service.update(1, { name: 'Plomería General' });

      // Assert
      expect(result).toEqual(updated);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Plomería General' },
      });
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('debe retornar la categoría eliminada', async () => {
      // Arrange
      mockDelete.mockResolvedValue(baseCategory);

      // Act
      const result = await service.delete(1);

      // Assert
      expect(result).toEqual(baseCategory);
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  // ── countSubcategories ─────────────────────────────────────────────────
  describe('countSubcategories', () => {
    it('debe retornar la cantidad de subcategorías de la categoría padre', async () => {
      // Arrange
      mockCount.mockResolvedValue(3);

      // Act
      const result = await service.countSubcategories(1);

      // Assert
      expect(result).toBe(3);
      expect(mockCount).toHaveBeenCalledWith({
        where: { parentCategoryId: 1 },
      });
    });

    it('debe retornar 0 cuando la categoría no tiene subcategorías', async () => {
      // Arrange
      mockCount.mockResolvedValue(0);

      // Act
      const result = await service.countSubcategories(99);

      // Assert
      expect(result).toBe(0);
    });
  });

  // ── search ─────────────────────────────────────────────────────────────
  describe('search', () => {
    it('debe retornar categorías activas y visibles que coinciden con el término', async () => {
      // Arrange
      const matches = [baseCategory];
      mockFindMany.mockResolvedValue(matches);

      // Act
      const result = await service.search('plom');

      // Assert
      expect(result).toEqual(matches);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          status: CategoryStatus.ACTIVE,
          isVisible: true,
          OR: [
            { name: { contains: 'plom', mode: 'insensitive' } },
            { description: { contains: 'plom', mode: 'insensitive' } },
          ],
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });
    });

    it('debe retornar lista vacía cuando ninguna categoría activa coincide con el término', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);

      // Act
      const result = await service.search('xyz_inexistente');

      // Assert
      expect(result).toEqual([]);
    });
  });
});
