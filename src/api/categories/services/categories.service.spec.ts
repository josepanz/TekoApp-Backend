import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryStatus } from '@prisma/client';
import type { Category } from '@prisma/client';
import { CategoriesDbService } from '@modules/categories-db/services/categories-db.service';
import { CategoriesService } from './categories.service';
import type { CreateCategoryDto } from '../dtos/request/create-category.dto';

// ── Mocks de CategoriesDbService ────────────────────────────────────────────
const mockCreate = jest.fn();
const mockFindUnique = jest.fn();
const mockFindFirst = jest.fn();
const mockFindMany = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockCountSubcategories = jest.fn();
const mockSearch = jest.fn();

// ── Fixture base de categoría ────────────────────────────────────────────────
const categoriaBase: Category = {
  id: 1,
  name: 'Tecnología',
  slug: 'tecnologia',
  description: 'Categoría de tecnología',
  icon: null,
  color: null,
  sortOrder: 0,
  status: CategoryStatus.ACTIVE,
  isVisible: true,
  requiresVerification: false,
  metadata: null,
  parentCategoryId: null,
  createdAt: new Date('2024-01-01'),
  createdBy: null,
  lastChangedAt: new Date('2024-01-01'),
  lastChangedBy: null,
  changedReason: null,
  checksum: null,
  changeSignature: null,
};

// ── Suite principal ──────────────────────────────────────────────────────────
describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: CategoriesDbService,
          useValue: {
            create: mockCreate,
            findUnique: mockFindUnique,
            findFirst: mockFindFirst,
            findMany: mockFindMany,
            update: mockUpdate,
            delete: mockDelete,
            countSubcategories: mockCountSubcategories,
            search: mockSearch,
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── findOne ──────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('debe retornar la categoría cuando existe', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(categoriaBase);

      // Act
      const resultado = await service.findOne(1);

      // Assert
      expect(resultado).toEqual(categoriaBase);
      expect(mockFindUnique).toHaveBeenCalledWith({ id: 1 });
    });

    it('debe lanzar NotFoundException si la categoría no existe', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────────────────────────────────
  describe('create', () => {
    const dto: CreateCategoryDto = {
      name: 'Salud',
      description: 'Categoría de salud',
      icon: null,
      color: null,
      sortOrder: 1,
      status: CategoryStatus.ACTIVE,
      isVisible: true,
      requiresVerification: false,
      metadata: null,
      slug: undefined,
      parentCategoryId: undefined,
    };

    it('debe crear la categoría correctamente y retornarla', async () => {
      // Arrange
      const categoriaCreada: Category = {
        ...categoriaBase,
        id: 2,
        name: 'Salud',
        slug: 'salud',
      };
      mockFindUnique.mockResolvedValue(null); // no existe previa con ese nombre
      mockCreate.mockResolvedValue(categoriaCreada);

      // Act
      const resultado = await service.create(dto);

      // Assert
      expect(resultado).toEqual(categoriaCreada);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Salud', slug: 'salud' }),
      );
    });

    it('debe lanzar ConflictException si ya existe una categoría con el mismo nombre', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(categoriaBase);

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si la categoría padre no existe', async () => {
      // Arrange
      const dtoConPadre: CreateCategoryDto = { ...dto, parentCategoryId: 99 };
      mockFindUnique
        .mockResolvedValueOnce(null) // búsqueda por nombre → no hay conflicto
        .mockResolvedValueOnce(null); // búsqueda de padre → no existe

      // Act & Assert
      await expect(service.create(dtoConPadre)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si la categoría padre ya es subcategoría (tercer nivel)', async () => {
      // Arrange
      const padreQueEsSubcategoria: Category = {
        ...categoriaBase,
        id: 50,
        parentCategoryId: 1, // ya tiene padre → tercer nivel prohibido
      };
      const dtoConPadre: CreateCategoryDto = { ...dto, parentCategoryId: 50 };

      mockFindUnique
        .mockResolvedValueOnce(null) // sin conflicto de nombre
        .mockResolvedValueOnce(padreQueEsSubcategoria); // padre encontrado pero es subcategoría

      // Act & Assert
      await expect(service.create(dtoConPadre)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  // ── changeStatus ─────────────────────────────────────────────────────────
  describe('changeStatus', () => {
    it('debe actualizar el status de la categoría existente', async () => {
      // Arrange
      const categoriaActualizada: Category = {
        ...categoriaBase,
        status: CategoryStatus.INACTIVE,
      };
      mockFindUnique.mockResolvedValue(categoriaBase);
      mockUpdate.mockResolvedValue(categoriaActualizada);

      // Act
      const resultado = await service.changeStatus(1, CategoryStatus.INACTIVE);

      // Assert
      expect(resultado.status).toBe(CategoryStatus.INACTIVE);
      expect(mockUpdate).toHaveBeenCalledWith(1, {
        status: CategoryStatus.INACTIVE,
      });
    });

    it('debe lanzar NotFoundException si la categoría no existe al cambiar estado', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.changeStatus(999, CategoryStatus.INACTIVE),
      ).rejects.toThrow(NotFoundException);
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  // ── getCategoryStats ──────────────────────────────────────────────────────
  describe('getCategoryStats', () => {
    it('debe retornar professionalCount, serviceCount, averageRating y totalServices correctamente', async () => {
      // Arrange
      const categoriaConRelaciones = {
        ...categoriaBase,
        professionals: [
          { averageRating: 4.5 },
          { averageRating: 5.0 },
          { averageRating: 0 }, // sin calificación, no debe contar
        ],
        services: [{}, {}],
      };
      mockFindUnique.mockResolvedValue(categoriaConRelaciones);

      // Act
      const stats = await service.getCategoryStats(1);

      // Assert
      expect(stats.professionalCount).toBe(3);
      expect(stats.serviceCount).toBe(2);
      expect(stats.totalServices).toBe(2);
      expect(stats.averageRating).toBe(4.75); // (4.5 + 5.0) / 2
    });

    it('debe retornar averageRating en 0 si ningún profesional tiene calificación', async () => {
      // Arrange
      const categoriaVacia = {
        ...categoriaBase,
        professionals: [{ averageRating: 0 }],
        services: [],
      };
      mockFindUnique.mockResolvedValue(categoriaVacia);

      // Act
      const stats = await service.getCategoryStats(1);

      // Assert
      expect(stats.averageRating).toBe(0);
      expect(stats.professionalCount).toBe(1);
      expect(stats.serviceCount).toBe(0);
    });

    it('debe lanzar NotFoundException si la categoría no existe al obtener stats', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getCategoryStats(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findSubcategories ─────────────────────────────────────────────────────
  describe('findSubcategories', () => {
    it('debe retornar las subcategorías del padre especificado', async () => {
      // Arrange
      const subcategorias: Category[] = [
        { ...categoriaBase, id: 10, name: 'Sub A', parentCategoryId: 1 },
        { ...categoriaBase, id: 11, name: 'Sub B', parentCategoryId: 1 },
      ];
      mockFindMany.mockResolvedValue(subcategorias);

      // Act
      const resultado = await service.findSubcategories(1);

      // Assert
      expect(resultado).toHaveLength(2);
      expect(resultado.every((c) => c.parentCategoryId === 1)).toBe(true);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ parentCategoryId: 1 }) as unknown,
        }),
      );
    });

    it('debe retornar arreglo vacío si el padre no tiene subcategorías', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);

      // Act
      const resultado = await service.findSubcategories(42);

      // Assert
      expect(resultado).toEqual([]);
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('debe retornar únicamente categorías activas y visibles', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([categoriaBase]);

      // Act
      const resultado = await service.findAll();

      // Assert
      expect(resultado).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: CategoryStatus.ACTIVE, isVisible: true },
        }),
      );
    });
  });

  // ── findBySlug ────────────────────────────────────────────────────────────
  describe('findBySlug', () => {
    it('debe retornar la categoría que coincide con el slug', async () => {
      // Arrange
      mockFindFirst.mockResolvedValue(categoriaBase);

      // Act
      const resultado = await service.findBySlug('tecnologia');

      // Assert
      expect(resultado).toEqual(categoriaBase);
      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'tecnologia' }),
      );
    });

    it('debe lanzar NotFoundException si no existe categoría con ese slug', async () => {
      // Arrange
      mockFindFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findBySlug('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── toggleVisibility ──────────────────────────────────────────────────────
  describe('toggleVisibility', () => {
    it('debe invertir la visibilidad de una categoría visible a oculta', async () => {
      // Arrange
      const categoriaOculta: Category = { ...categoriaBase, isVisible: false };
      mockFindUnique.mockResolvedValue(categoriaBase); // isVisible: true
      mockUpdate.mockResolvedValue(categoriaOculta);

      // Act
      const resultado = await service.toggleVisibility(1);

      // Assert
      expect(resultado.isVisible).toBe(false);
      expect(mockUpdate).toHaveBeenCalledWith(1, { isVisible: false });
    });

    it('debe lanzar NotFoundException si la categoría no existe al cambiar visibilidad', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.toggleVisibility(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── searchCategories ──────────────────────────────────────────────────────
  describe('searchCategories', () => {
    it('debe retornar resultados cuando el query tiene contenido', async () => {
      // Arrange
      mockSearch.mockResolvedValue([categoriaBase]);

      // Act
      const resultado = await service.searchCategories('tec');

      // Assert
      expect(resultado).toHaveLength(1);
      expect(mockSearch).toHaveBeenCalledWith('tec');
    });

    it('debe retornar arreglo vacío sin llamar al db si el query está vacío', async () => {
      // Act
      const resultado = await service.searchCategories('');

      // Assert
      expect(resultado).toEqual([]);
      expect(mockSearch).not.toHaveBeenCalled();
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('debe eliminar la categoría si no tiene dependencias', async () => {
      // Arrange
      const categoriaLimpia = {
        ...categoriaBase,
        professionals: [],
        services: [],
      };
      mockFindUnique.mockResolvedValue(categoriaLimpia);
      mockCountSubcategories.mockResolvedValue(0);
      mockDelete.mockResolvedValue(categoriaLimpia);

      // Act
      await service.remove(1);

      // Assert
      expect(mockDelete).toHaveBeenCalledWith(1);
    });

    it('debe lanzar NotFoundException si la categoría no existe al eliminar', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si la categoría tiene subcategorías hijas', async () => {
      // Arrange
      const categoriaLimpia = {
        ...categoriaBase,
        professionals: [],
        services: [],
      };
      mockFindUnique.mockResolvedValue(categoriaLimpia);
      mockCountSubcategories.mockResolvedValue(3);

      // Act & Assert
      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});
