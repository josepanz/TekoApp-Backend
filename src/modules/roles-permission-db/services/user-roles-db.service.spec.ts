import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRoles } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { UserRolesDBService } from './user-roles-db.service';
import { UsersDBService } from '@modules/users-db/services/users-db.service';
import { RolesDBService } from './roles-db.service';

// ── Mock functions (module scope) ─────────────────────────────────────────────

// Transaction
const mockTxUserRolesFindMany = jest.fn();
const mockTxUserRolesDeleteMany = jest.fn();
const mockTxUserRolesCreateMany = jest.fn();
const mockTxAuditLogsCreate = jest.fn();

const mockTx = {
  userRoles: {
    findMany: mockTxUserRolesFindMany,
    deleteMany: mockTxUserRolesDeleteMany,
    createMany: mockTxUserRolesCreateMany,
  },
  auditLogs: {
    create: mockTxAuditLogsCreate,
  },
};

const mockTransaction = jest
  .fn()
  .mockImplementation((cb: (tx: typeof mockTx) => unknown) => cb(mockTx));

// Direct prisma calls
const mockUserRolesFindMany = jest.fn();
const mockUserRolesCount = jest.fn();

const mockPrisma = {
  extended: {
    userRoles: {
      findMany: mockUserRolesFindMany,
      count: mockUserRolesCount,
    },
    $transaction: mockTransaction,
  },
};

// UsersDBService
const mockUsersFindById = jest.fn();
const mockUsersDBService = { findById: mockUsersFindById };

// RolesDBService
const mockRolesFindById = jest.fn();
const mockGetPermissionsByRoleIds = jest.fn();
const mockRolesDBService = {
  findById: mockRolesFindById,
  getPermissionsByRoleIds: mockGetPermissionsByRoleIds,
};

// ── Fixtures ──────────────────────────────────────────────────────────────────

const buildUser = (overrides = {}) => ({
  id: 1,
  email: 'user@example.com',
  firstName: 'Juan',
  lastName: 'Pérez',
  status: 'ACTIVE',
  ...overrides,
});

const buildRole = (id: number, name: string, isActive = true) => ({
  id,
  name,
  description: null,
  isActive,
  createdBy: 'admin',
  lastChangedBy: null,
  lastChangedAt: null,
  changedReason: null,
  createdAt: new Date('2024-01-01'),
  displayName: null,
  checksum: null,
  changeSignature: null,
});

const buildUserRole = (userId: number, roleId: number): UserRoles => ({
  id: 1,
  userId,
  roleId,
  createdBy: 'admin',
  createdAt: new Date('2024-01-01'),
  lastChangedAt: null,
  lastChangedBy: null,
  changedReason: null,
  isActive: true,
  checksum: null,
  changeSignature: null,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('UserRolesDBService', () => {
  let service: UserRolesDBService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRolesDBService,
        { provide: PrismaDatasource, useValue: mockPrisma },
        { provide: UsersDBService, useValue: mockUsersDBService },
        { provide: RolesDBService, useValue: mockRolesDBService },
      ],
    }).compile();

    service = module.get<UserRolesDBService>(UserRolesDBService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── assignRolesToUser ────────────────────────────────────────────────────

  describe('assignRolesToUser', () => {
    it('ejecuta la operación dentro de una transacción', async () => {
      // Arrange
      const data = { userId: 1, roleIds: [5, 6], createdBy: 'admin' };
      const finalRoles = [buildUserRole(1, 5), buildUserRole(1, 6)];
      mockTxUserRolesFindMany.mockResolvedValueOnce([]);
      mockTxUserRolesCreateMany.mockResolvedValue({ count: 2 });
      mockTxUserRolesFindMany.mockResolvedValueOnce(finalRoles);

      // Act
      await service.assignRolesToUser(data);

      // Assert
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockTxAuditLogsCreate).toHaveBeenCalled();
      expect(mockTxUserRolesDeleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it('retorna arreglo vacío y no crea roles cuando roleIds está vacío', async () => {
      // Arrange
      const data = { userId: 1, roleIds: [], createdBy: 'admin' };
      mockTxUserRolesFindMany.mockResolvedValueOnce([]);

      // Act
      const result = await service.assignRolesToUser(data);

      // Assert
      expect(mockTxUserRolesCreateMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('crea los roles correctos y retorna la lista actualizada', async () => {
      // Arrange
      const data = { userId: 1, roleIds: [5, 6], createdBy: 'admin' };
      const finalRoles = [buildUserRole(1, 5), buildUserRole(1, 6)];
      mockTxUserRolesFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(finalRoles);
      mockTxUserRolesCreateMany.mockResolvedValue({ count: 2 });

      // Act
      const result = await service.assignRolesToUser(data);

      // Assert
      expect(mockTxUserRolesCreateMany).toHaveBeenCalledWith({
        data: [
          { userId: 1, roleId: 5, createdBy: 'admin' },
          { userId: 1, roleId: 6, createdBy: 'admin' },
        ],
        skipDuplicates: true,
      });
      expect(result).toEqual(finalRoles);
    });
  });

  // ─── getRolesByUserId ─────────────────────────────────────────────────────

  describe('getRolesByUserId', () => {
    it('retorna solo los roles activos del usuario', async () => {
      // Arrange
      const roles = [{ ...buildUserRole(1, 5), role: buildRole(5, 'admin') }];
      mockUserRolesFindMany.mockResolvedValue(roles);

      // Act
      const result = await service.getRolesByUserId(1);

      // Assert
      expect(mockUserRolesFindMany).toHaveBeenCalledWith({
        where: { userId: 1, role: { isActive: true } },
        include: { role: true },
      });
      expect(result).toEqual(roles);
    });
  });

  // ─── userHasRole ──────────────────────────────────────────────────────────

  describe('userHasRole', () => {
    it('retorna true cuando el usuario tiene el rol activo asignado', async () => {
      // Arrange
      mockUserRolesCount.mockResolvedValue(1);

      // Act
      const result = await service.userHasRole(1, 5);

      // Assert
      expect(result).toBe(true);
    });

    it('retorna false cuando el usuario no tiene el rol asignado', async () => {
      // Arrange
      mockUserRolesCount.mockResolvedValue(0);

      // Act
      const result = await service.userHasRole(1, 99);

      // Assert
      expect(result).toBe(false);
    });
  });

  // ─── countUsersByRole ─────────────────────────────────────────────────────

  describe('countUsersByRole', () => {
    it('retorna el número de usuarios asignados al rol', async () => {
      // Arrange
      mockUserRolesCount.mockResolvedValue(5);

      // Act
      const result = await service.countUsersByRole(5);

      // Assert
      expect(mockUserRolesCount).toHaveBeenCalledWith({ where: { roleId: 5 } });
      expect(result).toBe(5);
    });
  });

  // ─── assignRolesToUserWithValidation ──────────────────────────────────────

  describe('assignRolesToUserWithValidation', () => {
    it('lanza NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.assignRolesToUserWithValidation({
          userId: 999,
          roleIds: [5],
          createdBy: 'admin',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza NotFoundException con el mensaje correcto al no encontrar el usuario', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.assignRolesToUserWithValidation({
          userId: 42,
          roleIds: [],
          createdBy: 'admin',
        }),
      ).rejects.toThrow('Usuario con ID 42 no encontrado.');
    });

    it('lanza NotFoundException cuando algún rol no existe o está inactivo', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(buildUser());
      mockRolesFindById
        .mockResolvedValueOnce(buildRole(5, 'admin'))
        .mockResolvedValueOnce(null);

      // Act & Assert
      await expect(
        service.assignRolesToUserWithValidation({
          userId: 1,
          roleIds: [5, 99],
          createdBy: 'admin',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('incluye los ids de roles inválidos en el mensaje de error', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(buildUser());
      mockRolesFindById
        .mockResolvedValueOnce(buildRole(5, 'admin'))
        .mockResolvedValueOnce(buildRole(99, 'inactivo', false));

      // Act & Assert
      await expect(
        service.assignRolesToUserWithValidation({
          userId: 1,
          roleIds: [5, 99],
          createdBy: 'admin',
        }),
      ).rejects.toThrow(
        'Los siguientes roles no existen o están inactivos: 99',
      );
    });

    it('asigna los roles correctamente cuando usuario y roles son válidos', async () => {
      // Arrange
      const data = { userId: 1, roleIds: [5, 6], createdBy: 'admin' };
      const finalRoles = [buildUserRole(1, 5), buildUserRole(1, 6)];
      mockUsersFindById.mockResolvedValue(buildUser());
      mockRolesFindById
        .mockResolvedValueOnce(buildRole(5, 'admin'))
        .mockResolvedValueOnce(buildRole(6, 'editor'));
      mockTxUserRolesFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(finalRoles);
      mockTxUserRolesCreateMany.mockResolvedValue({ count: 2 });

      // Act
      const result = await service.assignRolesToUserWithValidation(data);

      // Assert
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual(finalRoles);
    });

    it('omite la validación de roles cuando roleIds está vacío', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(buildUser());
      mockTxUserRolesFindMany.mockResolvedValueOnce([]);

      // Act
      const result = await service.assignRolesToUserWithValidation({
        userId: 1,
        roleIds: [],
        createdBy: 'admin',
      });

      // Assert
      expect(mockRolesFindById).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  // ─── getUserRoles ─────────────────────────────────────────────────────────

  describe('getUserRoles', () => {
    it('lanza NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserRoles(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna los roles del usuario cuando éste existe', async () => {
      // Arrange
      const roles = [{ ...buildUserRole(1, 5), role: buildRole(5, 'admin') }];
      mockUsersFindById.mockResolvedValue(buildUser());
      mockUserRolesFindMany.mockResolvedValue(roles);

      // Act
      const result = await service.getUserRoles(1);

      // Assert
      expect(mockUserRolesFindMany).toHaveBeenCalledWith({
        where: { userId: 1, role: { isActive: true } },
        include: { role: true },
      });
      expect(result).toEqual(roles);
    });
  });

  // ─── getPermissionsFromUserRoles ──────────────────────────────────────────

  describe('getPermissionsFromUserRoles', () => {
    it('retorna arreglo vacío cuando el usuario no tiene roles asignados', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(buildUser());
      mockUserRolesFindMany.mockResolvedValue([]);

      // Act
      const result = await service.getPermissionsFromUserRoles(1);

      // Assert
      expect(mockGetPermissionsByRoleIds).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('mapea correctamente los permisos de los roles del usuario', async () => {
      // Arrange
      const userRolesWithRole = [
        { ...buildUserRole(1, 5), role: buildRole(5, 'admin') },
        { ...buildUserRole(1, 6), role: buildRole(6, 'editor') },
      ];
      const rolePermissions = [
        {
          roleId: 5,
          permissionId: 10,
          permission: { id: 10, name: 'users:read', description: 'Lectura' },
        },
        {
          roleId: 6,
          permissionId: 11,
          permission: { id: 11, name: 'posts:write', description: 'Escritura' },
        },
      ];
      mockUsersFindById.mockResolvedValue(buildUser());
      mockUserRolesFindMany.mockResolvedValue(userRolesWithRole);
      mockGetPermissionsByRoleIds.mockResolvedValue(rolePermissions);

      // Act
      const result = await service.getPermissionsFromUserRoles(1);

      // Assert
      expect(mockGetPermissionsByRoleIds).toHaveBeenCalledWith([5, 6]);
      expect(result).toEqual([
        { roleId: 5, name: 'users:read', description: 'Lectura' },
        { roleId: 6, name: 'posts:write', description: 'Escritura' },
      ]);
    });

    it('lanza NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getPermissionsFromUserRoles(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── removeRoleFromUserWithValidation ─────────────────────────────────────

  describe('removeRoleFromUserWithValidation', () => {
    it('lanza NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.removeRoleFromUserWithValidation(999, 5, 'admin'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException cuando el usuario no tiene el rol asignado', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(buildUser());
      mockUserRolesCount.mockResolvedValue(0);

      // Act & Assert
      await expect(
        service.removeRoleFromUserWithValidation(1, 99, 'admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('incluye el id del rol en el mensaje de error cuando no está asignado', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(buildUser());
      mockUserRolesCount.mockResolvedValue(0);

      // Act & Assert
      await expect(
        service.removeRoleFromUserWithValidation(1, 99, 'admin'),
      ).rejects.toThrow('El usuario no tiene asignado el rol con ID 99.');
    });

    it('ejecuta la eliminación dentro de una transacción cuando la validación pasa', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(buildUser());
      mockUserRolesCount.mockResolvedValue(1);

      // Act
      await service.removeRoleFromUserWithValidation(1, 5, 'admin');

      // Assert
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockTxAuditLogsCreate).toHaveBeenCalled();
      expect(mockTxUserRolesDeleteMany).toHaveBeenCalledWith({
        where: { userId: 1, roleId: 5 },
      });
    });
  });
});
