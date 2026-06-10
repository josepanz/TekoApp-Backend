import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from '@api/categories/services/categories.service';
import { CategoryStatus } from '@prisma/client';

// ── mocks de nivel de módulo ─────────────────────────────────────────────────
const mockCreate = jest.fn();
const mockFindAll = jest.fn();
const mockFindAllWithRelations = jest.fn();
const mockFindMainCategories = jest.fn();
const mockFindSubcategories = jest.fn();
const mockSearchCategories = jest.fn();
const mockFindOne = jest.fn();
const mockFindBySlug = jest.fn();
const mockGetCategoryStats = jest.fn();
const mockUpdate = jest.fn();
const mockChangeStatus = jest.fn();
const mockToggleVisibility = jest.fn();
const mockRemove = jest.fn();

describe('CategoriesController', () => {
  let controller: CategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: {
            create: mockCreate,
            findAll: mockFindAll,
            findAllWithRelations: mockFindAllWithRelations,
            findMainCategories: mockFindMainCategories,
            findSubcategories: mockFindSubcategories,
            searchCategories: mockSearchCategories,
            findOne: mockFindOne,
            findBySlug: mockFindBySlug,
            getCategoryStats: mockGetCategoryStats,
            update: mockUpdate,
            changeStatus: mockChangeStatus,
            toggleVisibility: mockToggleVisibility,
            remove: mockRemove,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('debe retornar la categoría creada cuando los datos son válidos', async () => {
      // Arrange
      const dto = { name: 'Plomería', slug: 'plomeria' } as never;
      const expected = { id: 1, name: 'Plomería' };
      mockCreate.mockResolvedValue(expected);

      // Act
      const result = await controller.create(dto);

      // Assert
      expect(result).toEqual(expected);
      expect(mockCreate).toHaveBeenCalledWith(dto);
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('debe retornar la lista de categorías activas y visibles', async () => {
      // Arrange
      const expected = [{ id: 1, name: 'Plomería' }];
      mockFindAll.mockResolvedValue(expected);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindAll).toHaveBeenCalled();
    });

    it('debe retornar arreglo vacío cuando no existen categorías', async () => {
      // Arrange
      mockFindAll.mockResolvedValue([]);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });

  // ── findAllWithRelations ──────────────────────────────────────────────────
  describe('findAllWithRelations', () => {
    it('debe retornar todas las categorías con sus relaciones', async () => {
      // Arrange
      const expected = [{ id: 1, name: 'Plomería', subcategories: [] }];
      mockFindAllWithRelations.mockResolvedValue(expected);

      // Act
      const result = await controller.findAllWithRelations();

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindAllWithRelations).toHaveBeenCalled();
    });
  });

  // ── findMainCategories ────────────────────────────────────────────────────
  describe('findMainCategories', () => {
    it('debe retornar únicamente las categorías raíz activas', async () => {
      // Arrange
      const expected = [{ id: 1, name: 'Hogar', parentCategoryId: null }];
      mockFindMainCategories.mockResolvedValue(expected);

      // Act
      const result = await controller.findMainCategories();

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindMainCategories).toHaveBeenCalled();
    });
  });

  // ── findSubcategories ─────────────────────────────────────────────────────
  describe('findSubcategories', () => {
    it('debe retornar las subcategorías del padre solicitado', async () => {
      // Arrange
      const param = { parentId: 5 } as never;
      const expected = [{ id: 10, name: 'Desagüe', parentCategoryId: 5 }];
      mockFindSubcategories.mockResolvedValue(expected);

      // Act
      const result = await controller.findSubcategories(param);

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindSubcategories).toHaveBeenCalledWith(5);
    });
  });

  // ── searchCategories ──────────────────────────────────────────────────────
  describe('searchCategories', () => {
    it('debe retornar categorías que coincidan con el término de búsqueda', async () => {
      // Arrange
      const query = { q: 'plom' } as never;
      const expected = [{ id: 1, name: 'Plomería' }];
      mockSearchCategories.mockResolvedValue(expected);

      // Act
      const result = await controller.searchCategories(query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockSearchCategories).toHaveBeenCalledWith('plom');
    });

    it('debe retornar arreglo vacío cuando el término no coincide con nada', async () => {
      // Arrange
      const query = { q: 'xyz_no_existe' } as never;
      mockSearchCategories.mockResolvedValue([]);

      // Act
      const result = await controller.searchCategories(query);

      // Assert
      expect(result).toEqual([]);
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('debe retornar la categoría correspondiente al id proporcionado', async () => {
      // Arrange
      const param = { id: 1 } as never;
      const expected = { id: 1, name: 'Plomería' };
      mockFindOne.mockResolvedValue(expected);

      // Act
      const result = await controller.findOne(param);

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindOne).toHaveBeenCalledWith(1);
    });

    it('debe propagar NotFoundException cuando la categoría no existe', async () => {
      // Arrange
      const param = { id: 999 } as never;
      mockFindOne.mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(controller.findOne(param)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findBySlug ────────────────────────────────────────────────────────────
  describe('findBySlug', () => {
    it('debe retornar la categoría activa correspondiente al slug', async () => {
      // Arrange
      const expected = { id: 1, slug: 'plomeria', name: 'Plomería' };
      mockFindBySlug.mockResolvedValue(expected);

      // Act
      const result = await controller.findBySlug('plomeria');

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindBySlug).toHaveBeenCalledWith('plomeria');
    });

    it('debe propagar NotFoundException cuando el slug no existe', async () => {
      // Arrange
      mockFindBySlug.mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(controller.findBySlug('slug-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── getCategoryStats ──────────────────────────────────────────────────────
  describe('getCategoryStats', () => {
    it('debe retornar las estadísticas de la categoría solicitada', async () => {
      // Arrange
      const param = { id: 1 } as never;
      const expected = {
        professionalCount: 10,
        serviceCount: 5,
        averageRating: 4.5,
        totalServices: 5,
      };
      mockGetCategoryStats.mockResolvedValue(expected);

      // Act
      const result = await controller.getCategoryStats(param);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetCategoryStats).toHaveBeenCalledWith(1);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('debe retornar la categoría actualizada con los nuevos datos', async () => {
      // Arrange
      const param = { id: 1 } as never;
      const dto = { name: 'Plomería Avanzada' } as never;
      const expected = { id: 1, name: 'Plomería Avanzada' };
      mockUpdate.mockResolvedValue(expected);

      // Act
      const result = await controller.update(param, dto);

      // Assert
      expect(result).toEqual(expected);
      expect(mockUpdate).toHaveBeenCalledWith(1, dto);
    });

    it('debe propagar NotFoundException cuando se intenta actualizar una categoría inexistente', async () => {
      // Arrange
      const param = { id: 999 } as never;
      const dto = { name: 'X' } as never;
      mockUpdate.mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(controller.update(param, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── changeStatus ──────────────────────────────────────────────────────────
  describe('changeStatus', () => {
    it('debe retornar la categoría con el nuevo estado aplicado', async () => {
      // Arrange
      const param = { id: 1 } as never;
      const query = { status: CategoryStatus.INACTIVE } as never;
      const expected = { id: 1, status: CategoryStatus.INACTIVE };
      mockChangeStatus.mockResolvedValue(expected);

      // Act
      const result = await controller.changeStatus(param, query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockChangeStatus).toHaveBeenCalledWith(1, CategoryStatus.INACTIVE);
    });
  });

  // ── toggleVisibility ──────────────────────────────────────────────────────
  describe('toggleVisibility', () => {
    it('debe invertir la visibilidad de la categoría y retornar el resultado', async () => {
      // Arrange
      const param = { id: 1 } as never;
      const expected = { id: 1, isVisible: false };
      mockToggleVisibility.mockResolvedValue(expected);

      // Act
      const result = await controller.toggleVisibility(param);

      // Assert
      expect(result).toEqual(expected);
      expect(mockToggleVisibility).toHaveBeenCalledWith(1);
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('debe eliminar la categoría y retornar undefined (204)', async () => {
      // Arrange
      const param = { id: 1 } as never;
      mockRemove.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove(param);

      // Assert
      expect(result).toBeUndefined();
      expect(mockRemove).toHaveBeenCalledWith(1);
    });

    it('debe propagar NotFoundException cuando la categoría a eliminar no existe', async () => {
      // Arrange
      const param = { id: 999 } as never;
      mockRemove.mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(controller.remove(param)).rejects.toThrow(NotFoundException);
    });
  });
});
