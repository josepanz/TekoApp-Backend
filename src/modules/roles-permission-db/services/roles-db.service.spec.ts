import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Roles } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { GetRoleListQueryDTO } from '@api/roles-permission/dtos/request/get-role.request';
import { RolesDBService } from './roles-db.service';
import { RolePermissionsDBService } from './role-permissions-db.service';

// ── Mock functions (module scope) ─────────────────────────────────────────────

const mockRolesCreate = jest.fn();
const mockRolesFindUnique = jest.fn();
const mockRolesFindMany = jest.fn();
const mockRolesUpdate = jest.fn();
const mockRolesDelete = jest.fn();
const mockRolesCount = jest.fn();

const mockRolePermissionsFindMany = jest.fn();
const mockUserRolesCount = jest.fn();

const mockPrisma = {
  extended: {
    roles: {
      create: mockRolesCreate,
      findUnique: mockRolesFindUnique,
      findMany: mockRolesFindMany,
      update: mockRolesUpdate,
      delete: mockRolesDelete,
      count: mockRolesCount,
    },
    rolePermissions: {
      findMany: mockRolePermissionsFindMany,
    },
    userRoles: {
      count: mockUserRolesCount,
    },
  },
};

const mockAssignPermissionsToRole = jest.fn();
const mockGetPermissionsByRoleId = jest.fn();
const mockRemovePermissionFromRole = jest.fn();

const mockRolePermissionsDBService = {
  assignPermissionsToRole: mockAssignPermissionsToRole,
  getPermissionsByRoleId: mockGetPermissionsByRoleId,
  removePermissionFromRole: mockRemovePermissionFromRole,
};

// ── Fixtures ──────────────────────────────────────────────────────────────────

const buildRole = (overrides: Partial<Roles> = {}): Roles => ({
  id: 1,
  name: 'admin',
  description: 'Administrador del sistema',
  isActive: true,
  createdBy: 'system',
  lastChangedBy: null,
  lastChangedAt: null,
  changedReason: null,
  createdAt: new Date('2024-01-01'),
  displayName: null,
  checksum: null,
  changeSignature: null,
  ...overrides,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RolesDBService', () => {
  let service: RolesDBService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesDBService,
        { provide: PrismaDatasource, useValue: mockPrisma },
        {
          provide: RolePermissionsDBService,
          useValue: mockRolePermissionsDBService,
        },
      ],
    }).compile();

    service = module.get<RolesDBService>(RolesDBService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('persiste el rol y retorna el registro creado', async () => {
      // Arrange
      const data = {
        name: 'admin',
        description: 'Administrador',
        createdBy: 'system',
      };
      const expected = buildRole();
      mockRolesCreate.mockResolvedValue(expected);

      // Act
      const result = await service.create(data);

      // Assert
      expect(mockRolesCreate).toHaveBeenCalledWith({
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
    it('retorna el rol cuando el id existe', async () => {
      // Arrange
      const role = buildRole();
      mockRolesFindUnique.mockResolvedValue(role);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(mockRolesFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(role);
    });

    it('retorna null cuando el id no existe', async () => {
      // Arrange
      mockRolesFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  // ─── findByName ───────────────────────────────────────────────────────────

  describe('findByName', () => {
    it('retorna el rol cuando el nombre existe', async () => {
      // Arrange
      const role = buildRole();
      mockRolesFindUnique.mockResolvedValue(role);

      // Act
      const result = await service.findByName('admin');

      // Assert
      expect(mockRolesFindUnique).toHaveBeenCalledWith({
        where: { name: 'admin' },
      });
      expect(result).toEqual(role);
    });

    it('retorna null cuando el nombre no existe', async () => {
      // Arrange
      mockRolesFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findByName('inexistente');

      // Assert
      expect(result).toBeNull();
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('retorna todos los roles sin filtros cuando el query está vacío', async () => {
      // Arrange
      const roles = [buildRole()];
      mockRolesFindMany.mockResolvedValue(roles);

      // Act
      const result = await service.findAll(
        {} as unknown as GetRoleListQueryDTO,
      );

      // Assert
      expect(mockRolesFindMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(roles);
    });

    it('aplica filtro isActive cuando se especifica en el query', async () => {
      // Arrange
      mockRolesFindMany.mockResolvedValue([buildRole()]);

      // Act
      await service.findAll({
        isActive: true,
      } as unknown as GetRoleListQueryDTO);

      // Assert
      expect(mockRolesFindMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('aplica búsqueda por texto cuando se especifica search', async () => {
      // Arrange
      mockRolesFindMany.mockResolvedValue([]);

      // Act
      await service.findAll({
        search: 'admin',
      } as unknown as GetRoleListQueryDTO);

      // Assert
      expect(mockRolesFindMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'admin', mode: 'insensitive' } },
            { description: { contains: 'admin', mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ─── countByStatus ────────────────────────────────────────────────────────

  describe('countByStatus', () => {
    it('retorna totales correctos de roles activos e inactivos', async () => {
      // Arrange
      mockRolesCount.mockResolvedValueOnce(10).mockResolvedValueOnce(7);

      // Act
      const result = await service.countByStatus();

      // Assert
      expect(result).toEqual({ total: 10, active: 7, inactive: 3 });
    });
  });

  // ─── createRole ───────────────────────────────────────────────────────────

  describe('createRole', () => {
    it('lanza ConflictException cuando ya existe un rol con el mismo nombre', async () => {
      // Arrange
      mockRolesCount.mockResolvedValue(1);

      // Act & Assert
      await expect(
        service.createRole({ name: 'admin', createdBy: 'system' }),
      ).rejects.toThrow(ConflictException);
    });

    it('lanza ConflictException con el mensaje correcto al detectar duplicado', async () => {
      // Arrange
      mockRolesCount.mockResolvedValue(1);

      // Act & Assert
      await expect(
        service.createRole({ name: 'admin', createdBy: 'system' }),
      ).rejects.toThrow('El rol "admin" ya existe.');
    });

    it('crea y retorna el rol cuando el nombre no existe', async () => {
      // Arrange
      const data = {
        name: 'editor',
        description: 'Editor de contenido',
        createdBy: 'system',
      };
      const expected = buildRole({ name: 'editor' });
      mockRolesCount.mockResolvedValue(0);
      mockRolesCreate.mockResolvedValue(expected);

      // Act
      const result = await service.createRole(data);

      // Assert
      expect(mockRolesCreate).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  // ─── getRoleById ──────────────────────────────────────────────────────────

  describe('getRoleById', () => {
    it('lanza NotFoundException cuando el rol no existe', async () => {
      // Arrange
      mockRolesFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getRoleById(999)).rejects.toThrow(NotFoundException);
    });

    it('lanza NotFoundException con el mensaje correcto', async () => {
      // Arrange
      mockRolesFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getRoleById(42)).rejects.toThrow(
        'Rol con ID 42 no encontrado.',
      );
    });

    it('retorna el rol cuando el id existe', async () => {
      // Arrange
      const role = buildRole();
      mockRolesFindUnique.mockResolvedValue(role);

      // Act
      const result = await service.getRoleById(1);

      // Assert
      expect(result).toEqual(role);
    });
  });

  // ─── getRoleWithPermissions ───────────────────────────────────────────────

  describe('getRoleWithPermissions', () => {
    it('lanza NotFoundException cuando el rol no existe', async () => {
      // Arrange
      mockRolesFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getRoleWithPermissions(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna el rol con sus permisos cuando el id existe', async () => {
      // Arrange
      const roleWithPerms = {
        ...buildRole(),
        rolePermissions: [
          { permission: { id: 10, name: 'users:read', isActive: true } },
        ],
      };
      mockRolesFindUnique.mockResolvedValue(roleWithPerms);

      // Act
      const result = await service.getRoleWithPermissions(1);

      // Assert
      expect(mockRolesFindUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          rolePermissions: {
            where: { permission: { isActive: true } },
            include: { permission: true },
          },
        },
      });
      expect(result).toEqual(roleWithPerms);
    });
  });

  // ─── updateRole ───────────────────────────────────────────────────────────

  describe('updateRole', () => {
    it('lanza NotFoundException cuando el rol a actualizar no existe', async () => {
      // Arrange
      mockRolesFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateRole(999, { lastChangedBy: 'admin' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ConflictException cuando el nuevo nombre ya está en uso por otro rol', async () => {
      // Arrange
      mockRolesFindUnique.mockResolvedValue(buildRole());
      mockRolesCount.mockResolvedValue(1);

      // Act & Assert
      await expect(
        service.updateRole(1, { name: 'editor', lastChangedBy: 'admin' }),
      ).rejects.toThrow(ConflictException);
    });

    it('actualiza y retorna el rol cuando los datos son válidos', async () => {
      // Arrange
      const existing = buildRole();
      const updated = buildRole({ description: 'Nueva descripción' });
      mockRolesFindUnique.mockResolvedValue(existing);
      mockRolesCount.mockResolvedValue(0);
      mockRolesUpdate.mockResolvedValue(updated);

      // Act
      const result = await service.updateRole(1, {
        description: 'Nueva descripción',
        lastChangedBy: 'admin',
      });

      // Assert
      expect(mockRolesUpdate).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('actualiza sin verificar nombre duplicado cuando no se envía nombre', async () => {
      // Arrange
      const existing = buildRole();
      const updated = buildRole({ description: 'Solo descripción' });
      mockRolesFindUnique.mockResolvedValue(existing);
      mockRolesUpdate.mockResolvedValue(updated);

      // Act
      await service.updateRole(1, {
        description: 'Solo descripción',
        lastChangedBy: 'admin',
      });

      // Assert
      expect(mockRolesCount).not.toHaveBeenCalled();
    });
  });

  // ─── deleteRole ───────────────────────────────────────────────────────────

  describe('deleteRole', () => {
    it('lanza NotFoundException cuando el rol a eliminar no existe', async () => {
      // Arrange
      mockRolesFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteRole(999, 'admin')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza BadRequestException cuando el rol tiene usuarios asignados', async () => {
      // Arrange
      mockRolesFindUnique.mockResolvedValue(buildRole());
      mockUserRolesCount.mockResolvedValue(3);

      // Act & Assert
      await expect(service.deleteRole(1, 'admin')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('realiza soft delete cuando el rol no tiene usuarios asignados', async () => {
      // Arrange
      const deleted = buildRole({ isActive: false });
      mockRolesFindUnique.mockResolvedValue(buildRole());
      mockUserRolesCount.mockResolvedValue(0);
      mockRolesUpdate.mockResolvedValue(deleted);

      // Act
      const result = await service.deleteRole(1, 'admin', 'Ya no se usa');

      // Assert
      expect(mockRolesUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ isActive: false }) as unknown,
        }),
      );
      expect(result.isActive).toBe(false);
    });
  });

  // ─── assignPermissionsToRole ──────────────────────────────────────────────

  describe('assignPermissionsToRole', () => {
    it('lanza NotFoundException cuando el rol no existe', async () => {
      // Arrange
      mockRolesFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.assignPermissionsToRole({
          roleId: 999,
          permissionIds: [1],
          createdBy: 'admin',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('delega la asignación a RolePermissionsDBService cuando el rol existe', async () => {
      // Arrange
      const data = { roleId: 1, permissionIds: [10, 11], createdBy: 'admin' };
      const expected = [
        { roleId: 1, permissionId: 10 },
        { roleId: 1, permissionId: 11 },
      ];
      mockRolesFindUnique.mockResolvedValue(buildRole());
      mockAssignPermissionsToRole.mockResolvedValue(expected);

      // Act
      const result = await service.assignPermissionsToRole(data);

      // Assert
      expect(mockAssignPermissionsToRole).toHaveBeenCalledWith(data);
      expect(result).toEqual(expected);
    });
  });

  // ─── getRolePermissions ───────────────────────────────────────────────────

  describe('getRolePermissions', () => {
    it('lanza NotFoundException cuando el rol no existe', async () => {
      // Arrange
      mockRolesFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getRolePermissions(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna los permisos del rol delegando a RolePermissionsDBService', async () => {
      // Arrange
      const permissions = [
        { roleId: 1, permissionId: 10, permission: { name: 'users:read' } },
      ];
      mockRolesFindUnique.mockResolvedValue(buildRole());
      mockGetPermissionsByRoleId.mockResolvedValue(permissions);

      // Act
      const result = await service.getRolePermissions(1);

      // Assert
      expect(mockGetPermissionsByRoleId).toHaveBeenCalledWith(1);
      expect(result).toEqual(permissions);
    });
  });

  // ─── removePermissionFromRole ─────────────────────────────────────────────

  describe('removePermissionFromRole', () => {
    it('lanza NotFoundException cuando el rol no existe', async () => {
      // Arrange
      mockRolesFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.removePermissionFromRole(999, 10, 'admin'),
      ).rejects.toThrow(NotFoundException);
    });

    it('delega la eliminación a RolePermissionsDBService cuando el rol existe', async () => {
      // Arrange
      mockRolesFindUnique.mockResolvedValue(buildRole());
      mockRemovePermissionFromRole.mockResolvedValue(undefined);

      // Act
      await service.removePermissionFromRole(1, 10, 'admin');

      // Assert
      expect(mockRemovePermissionFromRole).toHaveBeenCalledWith(1, 10, 'admin');
    });
  });
});
