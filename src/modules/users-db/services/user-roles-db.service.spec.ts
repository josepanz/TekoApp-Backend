import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { UserRolesDBService } from './user-roles-db.service';

// ── Mock functions ─────────────────────────────────────────────────────────────
const mockUserRolesFindMany = jest.fn();
const mockUserRolesUpdateMany = jest.fn();
const mockUserRolesUpsert = jest.fn();
const mockRolesFindMany = jest.fn();

const mockPrisma = {
  extended: {
    userRoles: {
      findMany: mockUserRolesFindMany,
      updateMany: mockUserRolesUpdateMany,
      upsert: mockUserRolesUpsert,
    },
    roles: {
      findMany: mockRolesFindMany,
    },
  },
};

describe('UserRolesDBService', () => {
  let service: UserRolesDBService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRolesDBService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserRolesDBService>(UserRolesDBService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── getUserRoleIds ───────────────────────────────────────────────────────────
  describe('getUserRoleIds', () => {
    it('debe retornar los IDs de roles activos del usuario', async () => {
      // Arrange
      mockUserRolesFindMany.mockResolvedValue([{ roleId: 1 }, { roleId: 3 }]);

      // Act
      const result = await service.getUserRoleIds(10);

      // Assert
      expect(result).toEqual([1, 3]);
      expect(mockUserRolesFindMany).toHaveBeenCalledWith({
        where: { userId: 10, isActive: true, role: { isActive: true } },
        select: { roleId: true },
      });
    });

    it('debe retornar una lista vacía cuando el usuario no tiene roles activos', async () => {
      // Arrange
      mockUserRolesFindMany.mockResolvedValue([]);

      // Act
      const result = await service.getUserRoleIds(10);

      // Assert
      expect(result).toEqual([]);
    });
  });

  // ── replaceUserRoles ─────────────────────────────────────────────────────────
  describe('replaceUserRoles', () => {
    it('debe desactivar los roles actuales y hacer upsert del nuevo rol', async () => {
      // Arrange
      mockUserRolesUpdateMany.mockResolvedValue({ count: 1 });
      mockUserRolesUpsert.mockResolvedValue({});

      // Act
      await service.replaceUserRoles(10, [2], 'admin@example.com');

      // Assert
      expect(mockUserRolesUpdateMany).toHaveBeenCalledWith({
        where: { userId: 10, isActive: true },
        data: expect.objectContaining({
          isActive: false,
          lastChangedBy: 'admin@example.com',
        }) as unknown,
      });
      expect(mockUserRolesUpsert).toHaveBeenCalledWith({
        where: { userId_roleId: { userId: 10, roleId: 2 } },
        update: expect.objectContaining({ isActive: true }) as unknown,
        create: expect.objectContaining({
          userId: 10,
          roleId: 2,
          isActive: true,
        }) as unknown,
      });
    });

    it('debe usar el cliente de transacción cuando se proporciona uno', async () => {
      // Arrange
      const txUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
      const txUpsert = jest.fn().mockResolvedValue({});
      const txClient = {
        userRoles: { updateMany: txUpdateMany, upsert: txUpsert },
      };

      // Act
      await service.replaceUserRoles(
        10,
        [3],
        'admin@example.com',
        txClient as unknown as Parameters<typeof service.replaceUserRoles>[3],
      );

      // Assert
      expect(txUpdateMany).toHaveBeenCalled();
      expect(txUpsert).toHaveBeenCalled();
      expect(mockUserRolesUpdateMany).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException cuando se envía una lista vacía de roles', async () => {
      // Act & Assert
      await expect(
        service.replaceUserRoles(10, [], 'admin@example.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException cuando se intentan asignar más de un rol', async () => {
      // Act & Assert
      await expect(
        service.replaceUserRoles(10, [1, 2], 'admin@example.com'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── getAllAvailableRoles ──────────────────────────────────────────────────────
  describe('getAllAvailableRoles', () => {
    it('debe retornar todos los roles activos ordenados por nombre', async () => {
      // Arrange
      const roles = [
        {
          id: 1,
          name: 'ADMIN',
          displayName: 'Administrador',
          description: 'Rol admin',
        },
        { id: 2, name: 'USER', displayName: 'Usuario', description: null },
      ];
      mockRolesFindMany.mockResolvedValue(roles);

      // Act
      const result = await service.getAllAvailableRoles();

      // Assert
      expect(result).toEqual(roles);
      expect(mockRolesFindMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: { id: true, name: true, displayName: true, description: true },
        orderBy: { name: 'asc' },
      });
    });

    it('debe retornar lista vacía cuando no hay roles activos', async () => {
      // Arrange
      mockRolesFindMany.mockResolvedValue([]);

      // Act
      const result = await service.getAllAvailableRoles();

      // Assert
      expect(result).toEqual([]);
    });
  });
});
