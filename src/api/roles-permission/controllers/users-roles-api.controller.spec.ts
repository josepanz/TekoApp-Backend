import { Test, TestingModule } from '@nestjs/testing';
import { UsersRolesApiController } from './users-roles-api.controller';
import { RolesApiService } from '../services/roles-permission-api.service';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { AssignRolesToUserRequestDTO } from '@api/roles-permission/dtos/request/assign-roles-to-user.request.dto';
import { AssignPermissionsToUserRequestDTO } from '@api/roles-permission/dtos/request/assign-permissions-to-user.request.dto';

const mockAssignRolesToUser = jest.fn();
const mockGetUserWithRoles = jest.fn();
const mockAssignPermissionsToUser = jest.fn();

describe('UsersRolesApiController', () => {
  let controller: UsersRolesApiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersRolesApiController],
      providers: [
        {
          provide: RolesApiService,
          useValue: {
            assignRolesToUser: mockAssignRolesToUser,
            getUserWithRoles: mockGetUserWithRoles,
            assignPermissionsToUser: mockAssignPermissionsToUser,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<UsersRolesApiController>(UsersRolesApiController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('assignRolesToUser', () => {
    it('debería asignar roles al usuario y retornar el resultado de la asignación', async () => {
      // Arrange
      const paramDTO = { userId: 10 };
      const dto = { roleIds: [1, 2, 3] };
      const expected = { userId: 10, roles: [{ id: 1 }, { id: 2 }, { id: 3 }] };
      mockAssignRolesToUser.mockResolvedValue(expected);

      // Act
      const result = await controller.assignRolesToUser(
        paramDTO,
        dto as unknown as AssignRolesToUserRequestDTO,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockAssignRolesToUser).toHaveBeenCalledTimes(1);
      expect(mockAssignRolesToUser).toHaveBeenCalledWith(10, dto, 'system');
    });

    it('debería extraer el userId del paramDTO y delegarlo al servicio', async () => {
      // Arrange
      const paramDTO = { userId: 99 };
      const dto = { roleIds: [5] };
      mockAssignRolesToUser.mockResolvedValue({
        userId: 99,
        roles: [{ id: 5 }],
      });

      // Act
      await controller.assignRolesToUser(
        paramDTO,
        dto as unknown as AssignRolesToUserRequestDTO,
      );

      // Assert
      expect(mockAssignRolesToUser).toHaveBeenCalledWith(99, dto, 'system');
    });
  });

  describe('getUserWithRoles', () => {
    it('debería retornar el usuario con sus roles asignados', async () => {
      // Arrange
      const paramDTO = { userId: 7 };
      const expected = {
        id: 7,
        email: 'usuario@test.com',
        roles: [{ id: 1, name: 'Admin' }],
      };
      mockGetUserWithRoles.mockResolvedValue(expected);

      // Act
      const result = await controller.getUserWithRoles(paramDTO);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetUserWithRoles).toHaveBeenCalledTimes(1);
      expect(mockGetUserWithRoles).toHaveBeenCalledWith(7);
    });

    it('debería pasar el userId al servicio correctamente', async () => {
      // Arrange
      const paramDTO = { userId: 15 };
      mockGetUserWithRoles.mockResolvedValue({ id: 15, roles: [] });

      // Act
      await controller.getUserWithRoles(paramDTO);

      // Assert
      expect(mockGetUserWithRoles).toHaveBeenCalledWith(15);
    });
  });

  describe('assignPermissionsToUser', () => {
    it('debería asignar permisos al usuario y retornar el resultado de la asignación', async () => {
      // Arrange
      const paramDTO = { userId: 20 };
      const dto = { permissionIds: [100, 200] };
      const expected = { userId: 20, permissions: [{ id: 100 }, { id: 200 }] };
      mockAssignPermissionsToUser.mockResolvedValue(expected);

      // Act
      const result = await controller.assignPermissionsToUser(
        paramDTO,
        dto as unknown as AssignPermissionsToUserRequestDTO,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockAssignPermissionsToUser).toHaveBeenCalledTimes(1);
      expect(mockAssignPermissionsToUser).toHaveBeenCalledWith(
        20,
        dto,
        'system',
      );
    });

    it('debería extraer el userId del paramDTO al asignar permisos', async () => {
      // Arrange
      const paramDTO = { userId: 55 };
      const dto = { permissionIds: [301] };
      mockAssignPermissionsToUser.mockResolvedValue({
        userId: 55,
        permissions: [{ id: 301 }],
      });

      // Act
      await controller.assignPermissionsToUser(
        paramDTO,
        dto as unknown as AssignPermissionsToUserRequestDTO,
      );

      // Assert
      expect(mockAssignPermissionsToUser).toHaveBeenCalledWith(
        55,
        dto,
        'system',
      );
    });
  });
});
