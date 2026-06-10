import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PermissionsDBService } from './permissions-db.service';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { Permissions } from '@prisma/client';
import { GetPermissionListQueryDTO } from '@api/roles-permission/dtos/request';

// --- Mock functions (module scope) ---
const mockCreate = jest.fn();
const mockFindUnique = jest.fn();
const mockFindMany = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockCount = jest.fn();
const mockRolePermissionsCount = jest.fn();
const mockUserPermissionsCount = jest.fn();

const mockPrisma = {
  extended: {
    permissions: {
      create: mockCreate,
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      update: mockUpdate,
      delete: mockDelete,
      count: mockCount,
    },
    rolePermissions: {
      count: mockRolePermissionsCount,
    },
    userPermissions: {
      count: mockUserPermissionsCount,
    },
  },
};

const buildPermission = (
  overrides: Partial<Permissions> = {},
): Permissions => ({
  id: 1,
  name: 'users:read',
  description: 'Lectura de usuarios',
  isActive: true,
  createdBy: 'admin',
  lastChangedBy: null,
  lastChangedAt: null,
  changedReason: null,
  createdAt: new Date('2024-01-01'),
  displayName: null,
  checksum: null,
  changeSignature: null,
  ...overrides,
});

describe('PermissionsDBService', () => {
  let service: PermissionsDBService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsDBService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PermissionsDBService>(PermissionsDBService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('crea un permiso y retorna el registro creado', async () => {
      // Arrange
      const data = {
        name: 'users:read',
        description: 'Lectura',
        createdBy: 'admin',
      };
      const expected = buildPermission();
      mockCreate.mockResolvedValue(expected);

      // Act
      const result = await service.create(data);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          name: data.name,
          description: data.description,
          createdBy: data.createdBy,
          isActive: true,
        },
      });
      expect(result).toEqual(expected);
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('retorna el permiso cuando existe el id', async () => {
      // Arrange
      const permission = buildPermission();
      mockFindUnique.mockResolvedValue(permission);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(permission);
    });

    it('retorna null cuando el id no existe', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  // ─── findByName ───────────────────────────────────────────────────────────

  describe('findByName', () => {
    it('retorna el permiso cuando existe el nombre', async () => {
      // Arrange
      const permission = buildPermission();
      mockFindUnique.mockResolvedValue(permission);

      // Act
      const result = await service.findByName('users:read');

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { name: 'users:read' },
      });
      expect(result).toEqual(permission);
    });
  });

  // ─── findByIds ────────────────────────────────────────────────────────────

  describe('findByIds', () => {
    it('retorna lista de permisos activos para los ids dados', async () => {
      // Arrange
      const permissions = [
        buildPermission({ id: 1 }),
        buildPermission({ id: 2, name: 'users:write' }),
      ];
      mockFindMany.mockResolvedValue(permissions);

      // Act
      const result = await service.findByIds([1, 2]);

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] }, isActive: true },
      });
      expect(result).toHaveLength(2);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('retorna todos los permisos sin filtros cuando el query está vacío', async () => {
      // Arrange
      const permissions = [buildPermission()];
      mockFindMany.mockResolvedValue(permissions);

      // Act
      const result = await service.findAll({} as GetPermissionListQueryDTO);

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(permissions);
    });

    it('aplica filtro isActive cuando se especifica en el query', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([buildPermission()]);

      // Act
      await service.findAll({ isActive: true } as GetPermissionListQueryDTO);

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    });

    it('aplica búsqueda por texto en nombre y descripción cuando se especifica search', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);

      // Act
      await service.findAll({ search: 'user' } as GetPermissionListQueryDTO);

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'user', mode: 'insensitive' } },
            { description: { contains: 'user', mode: 'insensitive' } },
          ],
        },
        orderBy: { name: 'asc' },
      });
    });
  });

  // ─── countByStatus ────────────────────────────────────────────────────────

  describe('countByStatus', () => {
    it('retorna totales de permisos activos e inactivos', async () => {
      // Arrange
      mockCount.mockResolvedValueOnce(10).mockResolvedValueOnce(7);

      // Act
      const result = await service.countByStatus();

      // Assert
      expect(result).toEqual({ total: 10, active: 7, inactive: 3 });
    });
  });

  // ─── existsByName ─────────────────────────────────────────────────────────

  describe('existsByName', () => {
    it('retorna true cuando ya existe un permiso con ese nombre', async () => {
      // Arrange
      mockCount.mockResolvedValue(1);

      // Act
      const result = await service.existsByName('users:read');

      // Assert
      expect(result).toBe(true);
    });

    it('excluye el id indicado al verificar duplicados', async () => {
      // Arrange
      mockCount.mockResolvedValue(0);

      // Act
      const result = await service.existsByName('users:read', 5);

      // Assert
      expect(mockCount).toHaveBeenCalledWith({
        where: { name: 'users:read', id: { not: 5 } },
      });
      expect(result).toBe(false);
    });
  });

  // ─── isInUse ──────────────────────────────────────────────────────────────

  describe('isInUse', () => {
    it('retorna true cuando el permiso está asignado a un rol', async () => {
      // Arrange
      mockRolePermissionsCount.mockResolvedValue(1);
      mockUserPermissionsCount.mockResolvedValue(0);

      // Act
      const result = await service.isInUse(1);

      // Assert
      expect(result).toBe(true);
    });

    it('retorna false cuando el permiso no está asignado a ningún rol ni usuario', async () => {
      // Arrange
      mockRolePermissionsCount.mockResolvedValue(0);
      mockUserPermissionsCount.mockResolvedValue(0);

      // Act
      const result = await service.isInUse(1);

      // Assert
      expect(result).toBe(false);
    });
  });

  // ─── createPermission ─────────────────────────────────────────────────────

  describe('createPermission', () => {
    it('lanza BadRequestException cuando el nombre no sigue el formato resource:action', async () => {
      // Arrange
      const data = { name: 'INVALID_FORMAT', createdBy: 'admin' };

      // Act & Assert
      await expect(service.createPermission(data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lanza ConflictException cuando ya existe un permiso con el mismo nombre', async () => {
      // Arrange
      const data = { name: 'users:read', createdBy: 'admin' };
      mockCount.mockResolvedValue(1);

      // Act & Assert
      await expect(service.createPermission(data)).rejects.toThrow(
        ConflictException,
      );
    });

    it('crea el permiso cuando el formato es válido y no existe duplicado', async () => {
      // Arrange
      const data = {
        name: 'users:read',
        description: 'Lectura',
        createdBy: 'admin',
      };
      const expected = buildPermission();
      mockCount.mockResolvedValue(0);
      mockCreate.mockResolvedValue(expected);

      // Act
      const result = await service.createPermission(data);

      // Assert
      expect(mockCreate).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  // ─── getPermissionById ────────────────────────────────────────────────────

  describe('getPermissionById', () => {
    it('lanza NotFoundException cuando el permiso no existe', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getPermissionById(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna el permiso cuando el id existe', async () => {
      // Arrange
      const permission = buildPermission();
      mockFindUnique.mockResolvedValue(permission);

      // Act
      const result = await service.getPermissionById(1);

      // Assert
      expect(result).toEqual(permission);
    });
  });

  // ─── getPermissionByName ──────────────────────────────────────────────────

  describe('getPermissionByName', () => {
    it('lanza NotFoundException cuando el nombre no existe', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getPermissionByName('users:read')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── updatePermission ─────────────────────────────────────────────────────

  describe('updatePermission', () => {
    it('lanza NotFoundException cuando el permiso a actualizar no existe', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updatePermission(999, {
          name: 'users:write',
          lastChangedBy: 'admin',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException cuando el nuevo nombre tiene formato inválido', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(buildPermission());

      // Act & Assert
      await expect(
        service.updatePermission(1, {
          name: 'INVALID',
          lastChangedBy: 'admin',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza ConflictException cuando el nuevo nombre ya está en uso por otro permiso', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(buildPermission());
      mockCount.mockResolvedValue(1);

      // Act & Assert
      await expect(
        service.updatePermission(1, {
          name: 'users:write',
          lastChangedBy: 'admin',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('actualiza y retorna el permiso cuando los datos son válidos', async () => {
      // Arrange
      const existing = buildPermission();
      const updated = buildPermission({ name: 'users:write' });
      mockFindUnique.mockResolvedValue(existing);
      mockCount.mockResolvedValue(0);
      mockUpdate.mockResolvedValue(updated);

      // Act
      const result = await service.updatePermission(1, {
        name: 'users:write',
        lastChangedBy: 'admin',
      });

      // Assert
      expect(mockUpdate).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });
  });

  // ─── deletePermission ─────────────────────────────────────────────────────

  describe('deletePermission', () => {
    it('lanza BadRequestException cuando el permiso está asignado a roles o usuarios', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(buildPermission());
      mockRolePermissionsCount.mockResolvedValue(2);
      mockUserPermissionsCount.mockResolvedValue(0);

      // Act & Assert
      await expect(service.deletePermission(1, 'admin')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('realiza soft delete cuando el permiso no está en uso', async () => {
      // Arrange
      const deleted = buildPermission({ isActive: false });
      mockFindUnique.mockResolvedValue(buildPermission());
      mockRolePermissionsCount.mockResolvedValue(0);
      mockUserPermissionsCount.mockResolvedValue(0);
      mockUpdate.mockResolvedValue(deleted);

      // Act
      const result = await service.deletePermission(1, 'admin', 'Ya no se usa');

      // Assert
      const expectedData = expect.objectContaining({
        isActive: false,
      }) as unknown as { isActive: boolean };
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expectedData,
        }),
      );
      expect(result.isActive).toBe(false);
    });
  });

  // ─── validatePermissions ──────────────────────────────────────────────────

  describe('validatePermissions', () => {
    it('lanza NotFoundException cuando alguno de los ids no existe o está inactivo', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([buildPermission({ id: 1 })]);

      // Act & Assert
      await expect(service.validatePermissions([1, 2])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna la lista de permisos cuando todos los ids son válidos', async () => {
      // Arrange
      const permissions = [
        buildPermission({ id: 1 }),
        buildPermission({ id: 2, name: 'users:write' }),
      ];
      mockFindMany.mockResolvedValue(permissions);

      // Act
      const result = await service.validatePermissions([1, 2]);

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toEqual(permissions);
    });
  });
});
