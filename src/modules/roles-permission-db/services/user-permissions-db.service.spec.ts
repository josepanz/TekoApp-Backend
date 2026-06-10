import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserPermissions } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { UserPermissionsDBService } from './user-permissions-db.service';
import { UsersDBService } from '@modules/users-db/services/users-db.service';
import { PermissionsDBService } from './permissions-db.service';

// ── Mock functions (module scope) ─────────────────────────────────────────────

// Transaction
const mockTxUserPermissionsFindMany = jest.fn();
const mockTxUserPermissionsDeleteMany = jest.fn();
const mockTxUserPermissionsCreateMany = jest.fn();
const mockTxAuditLogsCreate = jest.fn();

const mockTx = {
  userPermissions: {
    findMany: mockTxUserPermissionsFindMany,
    deleteMany: mockTxUserPermissionsDeleteMany,
    createMany: mockTxUserPermissionsCreateMany,
  },
  auditLogs: {
    create: mockTxAuditLogsCreate,
  },
};

const mockTransaction = jest
  .fn()
  .mockImplementation((cb: (tx: typeof mockTx) => unknown) => cb(mockTx));

// Direct prisma calls
const mockUserPermissionsFindMany = jest.fn();
const mockUserPermissionsCount = jest.fn();

const mockPrisma = {
  extended: {
    userPermissions: {
      findMany: mockUserPermissionsFindMany,
      count: mockUserPermissionsCount,
    },
    $transaction: mockTransaction,
  },
};

// UsersDBService
const mockUsersFindById = jest.fn();
const mockUsersDBService = { findById: mockUsersFindById };

// PermissionsDBService
const mockPermissionsFindByIds = jest.fn();
const mockPermissionsDBService = { findByIds: mockPermissionsFindByIds };

// ── Fixtures ──────────────────────────────────────────────────────────────────

const buildUser = (overrides = {}) => ({
  id: 1,
  email: 'user@example.com',
  firstName: 'Juan',
  lastName: 'Pérez',
  status: 'ACTIVE',
  ...overrides,
});

const buildPermission = (id: number, name: string) => ({
  id,
  name,
  isActive: true,
  description: null,
  createdBy: 'admin',
  lastChangedBy: null,
  lastChangedAt: null,
  changedReason: null,
  createdAt: new Date('2024-01-01'),
  checksum: null,
  changeSignature: null,
});

const buildUserPermission = (
  userId: number,
  permissionId: number,
): UserPermissions => ({
  id: 1,
  userId,
  permissionId,
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

describe('UserPermissionsDBService', () => {
  let service: UserPermissionsDBService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPermissionsDBService,
        { provide: PrismaDatasource, useValue: mockPrisma },
        { provide: UsersDBService, useValue: mockUsersDBService },
        { provide: PermissionsDBService, useValue: mockPermissionsDBService },
      ],
    }).compile();

    service = module.get<UserPermissionsDBService>(UserPermissionsDBService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── assignPermissionsToUser ──────────────────────────────────────────────

  describe('assignPermissionsToUser', () => {
    it('ejecuta la operación dentro de una transacción', async () => {
      // Arrange
      const data = { userId: 1, permissionIds: [10, 11], createdBy: 'admin' };
      const finalPerms = [
        buildUserPermission(1, 10),
        buildUserPermission(1, 11),
      ];
      mockTxUserPermissionsFindMany.mockResolvedValueOnce([]);
      mockTxUserPermissionsCreateMany.mockResolvedValue({ count: 2 });
      mockTxUserPermissionsFindMany.mockResolvedValueOnce(finalPerms);

      // Act
      await service.assignPermissionsToUser(data);

      // Assert
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockTxAuditLogsCreate).toHaveBeenCalled();
      expect(mockTxUserPermissionsDeleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it('retorna arreglo vacío y no crea permisos cuando permissionIds está vacío', async () => {
      // Arrange
      const data = { userId: 1, permissionIds: [], createdBy: 'admin' };
      mockTxUserPermissionsFindMany.mockResolvedValueOnce([]);

      // Act
      const result = await service.assignPermissionsToUser(data);

      // Assert
      expect(mockTxUserPermissionsCreateMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('crea los permisos correctos y retorna la lista actualizada', async () => {
      // Arrange
      const data = { userId: 1, permissionIds: [10, 11], createdBy: 'admin' };
      const finalPerms = [
        buildUserPermission(1, 10),
        buildUserPermission(1, 11),
      ];
      mockTxUserPermissionsFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(finalPerms);
      mockTxUserPermissionsCreateMany.mockResolvedValue({ count: 2 });

      // Act
      const result = await service.assignPermissionsToUser(data);

      // Assert
      expect(mockTxUserPermissionsCreateMany).toHaveBeenCalledWith({
        data: [
          { userId: 1, permissionId: 10, createdBy: 'admin' },
          { userId: 1, permissionId: 11, createdBy: 'admin' },
        ],
        skipDuplicates: true,
      });
      expect(result).toEqual(finalPerms);
    });
  });

  // ─── getPermissionsByUserId ───────────────────────────────────────────────

  describe('getPermissionsByUserId', () => {
    it('retorna solo los permisos activos del usuario', async () => {
      // Arrange
      const perms = [
        {
          ...buildUserPermission(1, 10),
          permission: buildPermission(10, 'users:read'),
        },
      ];
      mockUserPermissionsFindMany.mockResolvedValue(perms);

      // Act
      const result = await service.getPermissionsByUserId(1);

      // Assert
      expect(mockUserPermissionsFindMany).toHaveBeenCalledWith({
        where: { userId: 1, permission: { isActive: true } },
        include: { permission: true },
      });
      expect(result).toEqual(perms);
    });
  });

  // ─── userHasPermission ────────────────────────────────────────────────────

  describe('userHasPermission', () => {
    it('retorna true cuando el usuario tiene el permiso activo asignado', async () => {
      // Arrange
      mockUserPermissionsCount.mockResolvedValue(1);

      // Act
      const result = await service.userHasPermission(1, 10);

      // Assert
      expect(result).toBe(true);
    });

    it('retorna false cuando el usuario no tiene el permiso asignado', async () => {
      // Arrange
      mockUserPermissionsCount.mockResolvedValue(0);

      // Act
      const result = await service.userHasPermission(1, 99);

      // Assert
      expect(result).toBe(false);
    });
  });

  // ─── assignPermissionsToUserWithValidation ────────────────────────────────

  describe('assignPermissionsToUserWithValidation', () => {
    it('lanza NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.assignPermissionsToUserWithValidation({
          userId: 999,
          permissionIds: [10],
          createdBy: 'admin',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza NotFoundException con el mensaje correcto al no encontrar el usuario', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.assignPermissionsToUserWithValidation({
          userId: 42,
          permissionIds: [],
          createdBy: 'admin',
        }),
      ).rejects.toThrow('Usuario con ID 42 no encontrado.');
    });

    it('lanza BadRequestException cuando algún permiso no existe o está inactivo', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(buildUser());
      mockPermissionsFindByIds.mockResolvedValue([
        buildPermission(10, 'users:read'),
      ]);

      // Act & Assert
      await expect(
        service.assignPermissionsToUserWithValidation({
          userId: 1,
          permissionIds: [10, 99],
          createdBy: 'admin',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('incluye los ids faltantes en el mensaje de error de permisos', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(buildUser());
      mockPermissionsFindByIds.mockResolvedValue([
        buildPermission(10, 'users:read'),
      ]);

      // Act & Assert
      await expect(
        service.assignPermissionsToUserWithValidation({
          userId: 1,
          permissionIds: [10, 99],
          createdBy: 'admin',
        }),
      ).rejects.toThrow(
        "Los siguientes id's de permisos no existen o están inactivos: 99",
      );
    });

    it('asigna los permisos correctamente cuando usuario y permisos son válidos', async () => {
      // Arrange
      const data = { userId: 1, permissionIds: [10, 11], createdBy: 'admin' };
      const finalPerms = [
        buildUserPermission(1, 10),
        buildUserPermission(1, 11),
      ];
      mockUsersFindById.mockResolvedValue(buildUser());
      mockPermissionsFindByIds.mockResolvedValue([
        buildPermission(10, 'users:read'),
        buildPermission(11, 'users:write'),
      ]);
      mockTxUserPermissionsFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(finalPerms);
      mockTxUserPermissionsCreateMany.mockResolvedValue({ count: 2 });

      // Act
      const result = await service.assignPermissionsToUserWithValidation(data);

      // Assert
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual(finalPerms);
    });

    it('omite validación de permisos cuando permissionIds está vacío', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(buildUser());
      mockTxUserPermissionsFindMany.mockResolvedValueOnce([]);

      // Act
      const result = await service.assignPermissionsToUserWithValidation({
        userId: 1,
        permissionIds: [],
        createdBy: 'admin',
      });

      // Assert
      expect(mockPermissionsFindByIds).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  // ─── getUserPermissions ───────────────────────────────────────────────────

  describe('getUserPermissions', () => {
    it('lanza NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserPermissions(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna los permisos del usuario cuando éste existe', async () => {
      // Arrange
      const perms = [
        {
          ...buildUserPermission(1, 10),
          permission: buildPermission(10, 'users:read'),
        },
      ];
      mockUsersFindById.mockResolvedValue(buildUser());
      mockUserPermissionsFindMany.mockResolvedValue(perms);

      // Act
      const result = await service.getUserPermissions(1);

      // Assert
      expect(mockUserPermissionsFindMany).toHaveBeenCalledWith({
        where: { userId: 1, permission: { isActive: true } },
        include: { permission: true },
      });
      expect(result).toEqual(perms);
    });
  });

  // ─── removePermissionFromUserWithValidation ───────────────────────────────

  describe('removePermissionFromUserWithValidation', () => {
    it('lanza NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.removePermissionFromUserWithValidation(999, 10, 'admin'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException cuando el usuario no tiene el permiso asignado', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(buildUser());
      mockUserPermissionsCount.mockResolvedValue(0);

      // Act & Assert
      await expect(
        service.removePermissionFromUserWithValidation(1, 99, 'admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('incluye el id del permiso en el mensaje de error cuando no está asignado', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(buildUser());
      mockUserPermissionsCount.mockResolvedValue(0);

      // Act & Assert
      await expect(
        service.removePermissionFromUserWithValidation(1, 99, 'admin'),
      ).rejects.toThrow('El usuario no tiene asignado el permiso con ID 99.');
    });

    it('ejecuta la eliminación dentro de una transacción cuando la validación pasa', async () => {
      // Arrange
      mockUsersFindById.mockResolvedValue(buildUser());
      mockUserPermissionsCount.mockResolvedValue(1);

      // Act
      await service.removePermissionFromUserWithValidation(1, 10, 'admin');

      // Assert
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockTxAuditLogsCreate).toHaveBeenCalled();
      expect(mockTxUserPermissionsDeleteMany).toHaveBeenCalledWith({
        where: { userId: 1, permissionId: 10 },
      });
    });
  });
});
