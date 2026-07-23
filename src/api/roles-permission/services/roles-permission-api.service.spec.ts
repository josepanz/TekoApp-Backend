import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RolesApiService } from './roles-permission-api.service';
import { RolesDBService } from '../../../modules/roles-permission-db/services/roles-db.service';
import { PermissionsDBService } from '../../../modules/roles-permission-db/services/permissions-db.service';
import { UserRolesDBService } from '../../../modules/roles-permission-db/services/user-roles-db.service';
import { UserPermissionsDBService } from '../../../modules/roles-permission-db/services/user-permissions-db.service';
import { UsersDBService } from '../../../modules/users-db/services/users-db.service';
import { RolesPermissionsMapper } from '../helpers';

// --- RolesDBService mocks ---
const mockCreateRole = jest.fn();
const mockGetRoleById = jest.fn();
const mockGetAllRoles = jest.fn();
const mockGetRolesStats = jest.fn();
const mockUpdateRole = jest.fn();

// --- PermissionsDBService mocks ---
const mockValidatePermissions = jest.fn();

// --- UserRolesDBService mocks ---
const mockAssignRolesToUserWithValidation = jest.fn();
const mockGetUserRoles = jest.fn();

// --- UserPermissionsDBService mocks ---
const mockGetUserPermissions = jest.fn();
const mockAssignPermissionsToUserWithValidation = jest.fn();

// --- UsersDBService mocks ---
const mockFindById = jest.fn();
const mockGetRolePermissions = jest.fn();

// --- RolesPermissionsMapper mocks ---
const mockPermissionToResponse = jest.fn();
const mockRoleToResponse = jest.fn();

describe('RolesApiService', () => {
  let service: RolesApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesApiService,
        {
          provide: RolesDBService,
          useValue: {
            createRole: mockCreateRole,
            getRoleById: mockGetRoleById,
            getAllRoles: mockGetAllRoles,
            getRolesStats: mockGetRolesStats,
            updateRole: mockUpdateRole,
          },
        },
        {
          provide: PermissionsDBService,
          useValue: {
            validatePermissions: mockValidatePermissions,
          },
        },
        {
          provide: UserRolesDBService,
          useValue: {
            assignRolesToUserWithValidation:
              mockAssignRolesToUserWithValidation,
            getUserRoles: mockGetUserRoles,
          },
        },
        {
          provide: UserPermissionsDBService,
          useValue: {
            getUserPermissions: mockGetUserPermissions,
            assignPermissionsToUserWithValidation:
              mockAssignPermissionsToUserWithValidation,
          },
        },
        {
          provide: UsersDBService,
          useValue: {
            findById: mockFindById,
            getRolePermissions: mockGetRolePermissions,
          },
        },
        {
          provide: RolesPermissionsMapper,
          useValue: {
            permissionToResponse: mockPermissionToResponse,
            roleToResponse: mockRoleToResponse,
          },
        },
      ],
    }).compile();

    service = module.get<RolesApiService>(RolesApiService);
  });

  afterEach(() => jest.clearAllMocks());

  // ──────────────────────────────────────────────
  // createRole
  // ──────────────────────────────────────────────
  describe('createRole', () => {
    it('debe crear el rol y retornar la respuesta mapeada', async () => {
      // Arrange
      const dto = { name: 'admin', description: 'Administrador' };
      const createdBy = 'user@test.com';
      const roleEntity = { id: 1, name: 'admin', description: 'Administrador' };
      const mappedResponse = { id: 1, name: 'admin' };
      mockCreateRole.mockResolvedValue(roleEntity);
      mockRoleToResponse.mockReturnValue(mappedResponse);

      // Act
      const result = await service.createRole(dto, createdBy);

      // Assert
      expect(mockCreateRole).toHaveBeenCalledWith({
        name: dto.name,
        description: dto.description,
        createdBy,
      });
      expect(mockRoleToResponse).toHaveBeenCalledWith(roleEntity);
      expect(result).toEqual(mappedResponse);
    });
  });

  // ──────────────────────────────────────────────
  // getRoleById
  // ──────────────────────────────────────────────
  describe('getRoleById', () => {
    it('debe retornar el rol mapeado cuando existe', async () => {
      // Arrange
      const roleEntity = { id: 5, name: 'editor' };
      const mappedResponse = { id: 5, name: 'editor' };
      mockGetRoleById.mockResolvedValue(roleEntity);
      mockRoleToResponse.mockReturnValue(mappedResponse);

      // Act
      const result = await service.getRoleById(5);

      // Assert
      expect(mockGetRoleById).toHaveBeenCalledWith(5);
      expect(mockRoleToResponse).toHaveBeenCalledWith(roleEntity);
      expect(result).toEqual(mappedResponse);
    });
  });

  // ──────────────────────────────────────────────
  // getAllRoles
  // ──────────────────────────────────────────────
  describe('getAllRoles', () => {
    it('debe retornar la lista de roles con estadísticas', async () => {
      // Arrange
      const query = { page: 1, limit: 10 } as never;
      const rolesEntities = [
        { id: 1, name: 'admin' },
        { id: 2, name: 'editor' },
      ];
      const stats = { total: 2, active: 2, inactive: 0 };
      mockGetAllRoles.mockResolvedValue(rolesEntities);
      mockGetRolesStats.mockResolvedValue(stats);
      mockRoleToResponse.mockImplementation(
        (role: { id: number; name: string }) => ({
          id: role.id,
          name: role.name,
        }),
      );

      // Act
      const result = await service.getAllRoles(query);

      // Assert
      expect(mockGetAllRoles).toHaveBeenCalledWith(query);
      expect(mockGetRolesStats).toHaveBeenCalled();
      expect(result.roles).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.active).toBe(2);
      expect(result.inactive).toBe(0);
    });

    it('debe retornar lista vacía cuando no hay roles', async () => {
      // Arrange
      mockGetAllRoles.mockResolvedValue([]);
      mockGetRolesStats.mockResolvedValue({ total: 0, active: 0, inactive: 0 });

      // Act
      const result = await service.getAllRoles({} as never);

      // Assert
      expect(result.roles).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // updateRole
  // ──────────────────────────────────────────────
  describe('updateRole', () => {
    it('debe actualizar el rol y retornar la respuesta mapeada', async () => {
      // Arrange
      const id = 3;
      const dto = {
        name: 'superadmin',
        description: 'Super admin',
        isActive: true,
      };
      const updatedBy = 'admin@test.com';
      const updatedEntity = { id: 3, name: 'superadmin' };
      const mappedResponse = { id: 3, name: 'superadmin' };
      mockUpdateRole.mockResolvedValue(updatedEntity);
      mockRoleToResponse.mockReturnValue(mappedResponse);

      // Act
      const result = await service.updateRole(id, dto, updatedBy);

      // Assert
      expect(mockUpdateRole).toHaveBeenCalledWith(id, {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive,
        lastChangedBy: updatedBy,
      });
      expect(mockRoleToResponse).toHaveBeenCalledWith(updatedEntity);
      expect(result).toEqual(mappedResponse);
    });
  });

  // ──────────────────────────────────────────────
  // assignRolesToUser
  // ──────────────────────────────────────────────
  describe('assignRolesToUser', () => {
    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      // Arrange
      mockFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.assignRolesToUser(99, { roles: [{ id: 1 }] }, 'admin@test.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar NotFoundException con el ID correcto en el mensaje', async () => {
      // Arrange
      mockFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.assignRolesToUser(42, { roles: [{ id: 1 }] }, 'admin@test.com'),
      ).rejects.toThrow('El usuario con ID 42 no existe');
    });

    it('debe asignar roles y retornar el resultado con success: true', async () => {
      // Arrange
      const userId = 1;
      const dto = { roles: [{ id: 10 }, { id: 20 }] };
      const assignedBy = 'admin@test.com';
      const user = {
        id: 1,
        email: 'user@test.com',
        firstName: 'Juan',
        lastName: 'Pérez',
      };
      const userRoles = [
        { role: { id: 10, name: 'admin', displayName: 'Admin' } },
        { role: { id: 20, name: 'editor', displayName: 'Editor' } },
      ];
      mockFindById.mockResolvedValue(user);
      mockAssignRolesToUserWithValidation.mockResolvedValue(undefined);
      mockGetUserRoles.mockResolvedValue(userRoles);

      // Act
      const result = await service.assignRolesToUser(userId, dto, assignedBy);

      // Assert
      expect(result.success).toBe(true);
      expect(result.userId).toBe(1);
      expect(result.userEmail).toBe('user@test.com');
      expect(result.assignedBy).toBe(assignedBy);
    });

    it('debe deduplicar roleIds antes de asignar', async () => {
      // Arrange
      const userId = 1;
      const dto = { roles: [{ id: 10 }, { id: 10 }, { id: 20 }] };
      const user = {
        id: 1,
        email: 'user@test.com',
        firstName: 'Ana',
        lastName: 'López',
      };
      const userRoles = [{ role: { id: 10, name: 'admin', displayName: '' } }];
      mockFindById.mockResolvedValue(user);
      mockAssignRolesToUserWithValidation.mockResolvedValue(undefined);
      mockGetUserRoles.mockResolvedValue(userRoles);

      // Act
      await service.assignRolesToUser(userId, dto, 'admin@test.com');

      // Assert
      expect(mockAssignRolesToUserWithValidation).toHaveBeenCalledWith(
        expect.objectContaining({ roleIds: [10, 20] }),
      );
    });

    it('debe retornar el conteo correcto de roles asignados', async () => {
      // Arrange
      const userId = 1;
      const dto = { roles: [{ id: 1 }, { id: 2 }, { id: 3 }] };
      const user = {
        id: 1,
        email: 'user@test.com',
        firstName: 'Carlos',
        lastName: 'Ruiz',
      };
      const userRoles = [
        { role: { id: 1, name: 'admin', displayName: 'Admin' } },
        { role: { id: 2, name: 'editor', displayName: 'Editor' } },
        { role: { id: 3, name: 'viewer', displayName: 'Viewer' } },
      ];
      mockFindById.mockResolvedValue(user);
      mockAssignRolesToUserWithValidation.mockResolvedValue(undefined);
      mockGetUserRoles.mockResolvedValue(userRoles);

      // Act
      const result = await service.assignRolesToUser(
        userId,
        dto,
        'admin@test.com',
      );

      // Assert
      expect(result.totalProcessed).toBe(3);
      expect(result.successfulAssignments).toBe(3);
      expect(result.failedAssignments).toBe(0);
      expect(result.roles).toHaveLength(3);
    });
  });

  // ──────────────────────────────────────────────
  // getUserWithRoles
  // ──────────────────────────────────────────────
  describe('getUserWithRoles', () => {
    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      // Arrange
      mockFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserWithRoles(99)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar NotFoundException con el ID correcto en el mensaje', async () => {
      // Arrange
      mockFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserWithRoles(55)).rejects.toThrow(
        'El usuario con ID 55 no existe',
      );
    });

    it('debe retornar usuario con roles, permisos directos y todos los permisos', async () => {
      // Arrange
      const userId = 1;
      const user = {
        id: 1,
        email: 'user@test.com',
        firstName: 'María',
        lastName: 'García',
      };
      const userRoles = [
        {
          role: {
            id: 10,
            name: 'admin',
            displayName: 'Admin',
            description: 'Administrador',
            isActive: true,
          },
        },
      ];
      const directPermissions = [
        {
          permission: {
            id: 100,
            name: 'read:users',
            displayName: 'Leer usuarios',
          },
        },
      ];
      const rolePermissionsData = [{ name: 'write:posts' }];
      mockFindById.mockResolvedValue(user);
      mockGetUserRoles.mockResolvedValue(userRoles);
      mockGetUserPermissions.mockResolvedValue(directPermissions);
      mockGetRolePermissions.mockResolvedValue(rolePermissionsData);

      // Act
      const result = await service.getUserWithRoles(userId);

      // Assert
      expect(result.userId).toBe(1);
      expect(result.email).toBe('user@test.com');
      expect(result.roles).toHaveLength(1);
      expect(result.directPermissions).toHaveLength(1);
      expect(result.rolesCount).toBe(1);
    });

    it('debe incluir permisos de rol y permisos directos en allPermissions', async () => {
      // Arrange
      const userId = 1;
      const user = {
        id: 1,
        email: 'user@test.com',
        firstName: 'Luis',
        lastName: 'Torres',
      };
      const userRoles = [
        {
          role: {
            id: 10,
            name: 'admin',
            displayName: 'Admin',
            description: 'Administrador',
            isActive: true,
          },
        },
      ];
      const directPermissions = [
        {
          permission: {
            id: 200,
            name: 'delete:posts',
            displayName: 'Eliminar posts',
          },
        },
      ];
      const rolePermissionsData = [
        { name: 'read:posts' },
        { name: 'write:posts' },
      ];
      mockFindById.mockResolvedValue(user);
      mockGetUserRoles.mockResolvedValue(userRoles);
      mockGetUserPermissions.mockResolvedValue(directPermissions);
      mockGetRolePermissions.mockResolvedValue(rolePermissionsData);

      // Act
      const result = await service.getUserWithRoles(userId);

      // Assert
      // rolePermissions: read:posts, write:posts + directPermission: delete:posts = 3 unique
      expect(result.allPermissions).toHaveLength(3);
      expect(result.permissionsCount).toBe(3);
    });

    it('debe agregar permisos directos al mapa de allPermissions con source "directo"', async () => {
      // Arrange
      const userId = 1;
      const user = {
        id: 1,
        email: 'user@test.com',
        firstName: 'Sofía',
        lastName: 'Méndez',
      };
      const userRoles = [
        {
          role: {
            id: 10,
            name: 'admin',
            displayName: 'Admin',
            description: '',
            isActive: true,
          },
        },
      ];
      const directPermissions = [
        {
          permission: {
            id: 300,
            name: 'special:action',
            displayName: 'Acción especial',
          },
        },
      ];
      mockFindById.mockResolvedValue(user);
      mockGetUserRoles.mockResolvedValue(userRoles);
      mockGetUserPermissions.mockResolvedValue(directPermissions);
      mockGetRolePermissions.mockResolvedValue([]);

      // Act
      const result = await service.getUserWithRoles(userId);

      // Assert
      const directPerm = result.allPermissions.find(
        (p) => p.name === 'special:action',
      );
      expect(directPerm).toBeDefined();
      expect(directPerm.source).toBe('directo');
    });

    it('debe llamar a getRolePermissions con los IDs de roles del usuario', async () => {
      // Arrange
      const userId = 1;
      const user = {
        id: 1,
        email: 'user@test.com',
        firstName: 'Pedro',
        lastName: 'Núñez',
      };
      const userRoles = [
        {
          role: {
            id: 10,
            name: 'admin',
            displayName: '',
            description: '',
            isActive: true,
          },
        },
        {
          role: {
            id: 20,
            name: 'editor',
            displayName: '',
            description: '',
            isActive: true,
          },
        },
      ];
      mockFindById.mockResolvedValue(user);
      mockGetUserRoles.mockResolvedValue(userRoles);
      mockGetUserPermissions.mockResolvedValue([]);
      mockGetRolePermissions.mockResolvedValue([]);

      // Act
      await service.getUserWithRoles(userId);

      // Assert
      expect(mockGetRolePermissions).toHaveBeenCalledWith([10, 20]);
    });
  });

  // ──────────────────────────────────────────────
  // assignPermissionsToUser
  // ──────────────────────────────────────────────
  describe('assignPermissionsToUser', () => {
    it('debe validar permisos antes de asignar', async () => {
      // Arrange
      const userId = 1;
      const dto = { permissions: [{ id: 101 }, { id: 102 }] };
      const user = {
        id: 1,
        email: 'user@test.com',
        firstName: 'Elena',
        lastName: 'Vega',
      };
      const validatedPerms = [
        { id: 101, name: 'read:users', displayName: 'Leer usuarios' },
        { id: 102, name: 'write:users', displayName: 'Escribir usuarios' },
      ];
      mockValidatePermissions.mockResolvedValue(validatedPerms);
      mockAssignPermissionsToUserWithValidation.mockResolvedValue(undefined);
      mockFindById.mockResolvedValue(user);

      // Act
      await service.assignPermissionsToUser(userId, dto, 'admin@test.com');

      // Assert
      expect(mockValidatePermissions).toHaveBeenCalledWith([101, 102]);
    });

    it('debe asignar permisos y retornar resultado con success: true', async () => {
      // Arrange
      const userId = 1;
      const dto = { permissions: [{ id: 101 }] };
      const assignedBy = 'admin@test.com';
      const user = {
        id: 1,
        email: 'user@test.com',
        firstName: 'Elena',
        lastName: 'Vega',
      };
      const validatedPerms = [
        { id: 101, name: 'read:users', displayName: 'Leer usuarios' },
      ];
      mockValidatePermissions.mockResolvedValue(validatedPerms);
      mockAssignPermissionsToUserWithValidation.mockResolvedValue(undefined);
      mockFindById.mockResolvedValue(user);

      // Act
      const result = await service.assignPermissionsToUser(
        userId,
        dto,
        assignedBy,
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.userId).toBe(1);
      expect(result.userEmail).toBe('user@test.com');
      expect(result.assignedBy).toBe(assignedBy);
      expect(result.permissions).toHaveLength(1);
    });

    it('debe retornar los conteos correctos de permisos procesados', async () => {
      // Arrange
      const userId = 1;
      const dto = { permissions: [{ id: 1 }, { id: 2 }, { id: 3 }] };
      const user = {
        id: 1,
        email: 'user@test.com',
        firstName: 'Tomás',
        lastName: 'Castro',
      };
      const validatedPerms = [
        { id: 1, name: 'p1', displayName: '' },
        { id: 2, name: 'p2', displayName: '' },
        { id: 3, name: 'p3', displayName: '' },
      ];
      mockValidatePermissions.mockResolvedValue(validatedPerms);
      mockAssignPermissionsToUserWithValidation.mockResolvedValue(undefined);
      mockFindById.mockResolvedValue(user);

      // Act
      const result = await service.assignPermissionsToUser(
        userId,
        dto,
        'admin@test.com',
      );

      // Assert
      expect(result.totalProcessed).toBe(3);
      expect(result.successfulAssignments).toBe(3);
      expect(result.failedAssignments).toBe(0);
    });

    it('debe lanzar NotFoundException si el usuario no existe después de asignar', async () => {
      // Arrange
      const userId = 99;
      const dto = { permissions: [{ id: 101 }] };
      mockValidatePermissions.mockResolvedValue([
        { id: 101, name: 'read:users', displayName: '' },
      ]);
      mockAssignPermissionsToUserWithValidation.mockResolvedValue(undefined);
      mockFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.assignPermissionsToUser(userId, dto, 'admin@test.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar NotFoundException con el ID correcto en el mensaje al asignar permisos', async () => {
      // Arrange
      mockValidatePermissions.mockResolvedValue([
        { id: 5, name: 'any', displayName: '' },
      ]);
      mockAssignPermissionsToUserWithValidation.mockResolvedValue(undefined);
      mockFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.assignPermissionsToUser(
          77,
          { permissions: [{ id: 5 }] },
          'admin@test.com',
        ),
      ).rejects.toThrow('El usuario con ID 77 no existe');
    });
  });
});
