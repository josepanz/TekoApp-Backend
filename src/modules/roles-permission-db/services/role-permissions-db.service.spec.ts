import { Test, TestingModule } from '@nestjs/testing';
import { RolePermissionsDBService } from './role-permissions-db.service';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { RolePermissions } from '@prisma/client';

// --- Mock functions (module scope) ---
const mockFindMany = jest.fn();
const mockCount = jest.fn();

// Transaction internals
const mockTxRolePermissionsFindMany = jest.fn();
const mockTxRolePermissionsDeleteMany = jest.fn();
const mockTxRolePermissionsCreateMany = jest.fn();
const mockTxAuditLogsCreate = jest.fn();

const mockTx = {
  rolePermissions: {
    findMany: mockTxRolePermissionsFindMany,
    deleteMany: mockTxRolePermissionsDeleteMany,
    createMany: mockTxRolePermissionsCreateMany,
  },
  auditLogs: {
    create: mockTxAuditLogsCreate,
  },
};

const mockTransaction = jest
  .fn()
  .mockImplementation((cb: (tx: typeof mockTx) => unknown) => cb(mockTx));

const mockPrisma = {
  extended: {
    $transaction: mockTransaction,
    rolePermissions: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
};

const buildRolePermission = (
  overrides: Partial<RolePermissions> = {},
): RolePermissions => ({
  id: 1,
  roleId: 10,
  permissionId: 20,
  createdBy: 'admin',
  createdAt: new Date('2024-01-01'),
  lastChangedAt: null,
  lastChangedBy: null,
  changedReason: null,
  isActive: true,
  checksum: null,
  changeSignature: null,
  ...overrides,
});

describe('RolePermissionsDBService', () => {
  let service: RolePermissionsDBService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolePermissionsDBService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RolePermissionsDBService>(RolePermissionsDBService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── assignPermissionsToRole ──────────────────────────────────────────────

  describe('assignPermissionsToRole', () => {
    it('asigna permisos a un rol ejecutando las operaciones dentro de una transacción', async () => {
      // Arrange
      const data = { roleId: 10, permissionIds: [20, 21], createdBy: 'admin' };
      const oldPerms = [buildRolePermission()];
      const newPerms = [
        buildRolePermission({ permissionId: 20 }),
        buildRolePermission({ id: 2, permissionId: 21 }),
      ];
      mockTxRolePermissionsFindMany
        .mockResolvedValueOnce(oldPerms)
        .mockResolvedValueOnce(newPerms);

      // Act
      const result = await service.assignPermissionsToRole(data);

      // Assert
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockTxAuditLogsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tableName: 'role_permissions',
            operationType: 'UPDATE',
          }) as Record<string, unknown>,
        }),
      );
      expect(mockTxRolePermissionsDeleteMany).toHaveBeenCalledWith({
        where: { roleId: 10 },
      });
      expect(mockTxRolePermissionsCreateMany).toHaveBeenCalledWith({
        data: [
          { roleId: 10, permissionId: 20, createdBy: 'admin' },
          { roleId: 10, permissionId: 21, createdBy: 'admin' },
        ],
        skipDuplicates: true,
      });
      expect(result).toEqual(newPerms);
    });

    it('retorna arreglo vacío y omite createMany cuando permissionIds está vacío', async () => {
      // Arrange
      const data = { roleId: 10, permissionIds: [], createdBy: 'admin' };
      mockTxRolePermissionsFindMany.mockResolvedValue([buildRolePermission()]);

      // Act
      const result = await service.assignPermissionsToRole(data);

      // Assert
      expect(mockTxRolePermissionsDeleteMany).toHaveBeenCalledWith({
        where: { roleId: 10 },
      });
      expect(mockTxRolePermissionsCreateMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  // ─── getPermissionsByRoleId ───────────────────────────────────────────────

  describe('getPermissionsByRoleId', () => {
    it('retorna los permisos activos asociados a un rol', async () => {
      // Arrange
      const perms = [buildRolePermission()];
      mockFindMany.mockResolvedValue(perms);

      // Act
      const result = await service.getPermissionsByRoleId(10);

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { roleId: 10, permission: { isActive: true } },
        include: { permission: true },
      });
      expect(result).toEqual(perms);
    });
  });

  // ─── getRolesByPermissionId ───────────────────────────────────────────────

  describe('getRolesByPermissionId', () => {
    it('retorna los roles activos que tienen asignado un permiso', async () => {
      // Arrange
      const rows = [buildRolePermission({ permissionId: 20 })];
      mockFindMany.mockResolvedValue(rows);

      // Act
      const result = await service.getRolesByPermissionId(20);

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { permissionId: 20, role: { isActive: true } },
        include: { role: true },
      });
      expect(result).toEqual(rows);
    });
  });

  // ─── roleHasPermission ────────────────────────────────────────────────────

  describe('roleHasPermission', () => {
    it('retorna true cuando el rol tiene el permiso activo asignado', async () => {
      // Arrange
      mockCount.mockResolvedValue(1);

      // Act
      const result = await service.roleHasPermission(10, 20);

      // Assert
      expect(mockCount).toHaveBeenCalledWith({
        where: { roleId: 10, permissionId: 20, permission: { isActive: true } },
      });
      expect(result).toBe(true);
    });

    it('retorna false cuando el rol no tiene el permiso asignado', async () => {
      // Arrange
      mockCount.mockResolvedValue(0);

      // Act
      const result = await service.roleHasPermission(10, 99);

      // Assert
      expect(result).toBe(false);
    });
  });

  // ─── removePermissionFromRole ─────────────────────────────────────────────

  describe('removePermissionFromRole', () => {
    it('elimina el permiso del rol y registra el audit log dentro de una transacción', async () => {
      // Arrange
      // Act
      await service.removePermissionFromRole(10, 20, 'admin');

      // Assert
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockTxAuditLogsCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tableName: 'role_permissions',
          recordId: '10-20',
          operationType: 'DELETE',
          oldData: { roleId: 10, permissionId: 20 },
          changedBy: 'admin',
        }) as Record<string, unknown>,
      });
      expect(mockTxRolePermissionsDeleteMany).toHaveBeenCalledWith({
        where: { roleId: 10, permissionId: 20 },
      });
    });
  });
});
