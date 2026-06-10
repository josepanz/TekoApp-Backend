import { Test, TestingModule } from '@nestjs/testing';
import { RolesApiController } from './roles-api.controller';
import { RolesApiService } from '../services/roles-permission-api.service';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { GetRoleListQueryDTO } from '@api/roles-permission/dtos/request';

const mockCreateRole = jest.fn();
const mockGetAllRoles = jest.fn();
const mockGetRoleById = jest.fn();
const mockUpdateRole = jest.fn();

describe('RolesApiController', () => {
  let controller: RolesApiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesApiController],
      providers: [
        {
          provide: RolesApiService,
          useValue: {
            createRole: mockCreateRole,
            getAllRoles: mockGetAllRoles,
            getRoleById: mockGetRoleById,
            updateRole: mockUpdateRole,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<RolesApiController>(RolesApiController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createRole', () => {
    it('debería crear un rol y retornar el rol creado', async () => {
      // Arrange
      const dto = { name: 'Admin', description: 'Rol administrador' };
      const userEmail = 'usuario@test.com';
      const expected = {
        id: 1,
        name: 'Admin',
        description: 'Rol administrador',
      };
      mockCreateRole.mockResolvedValue(expected);

      // Act
      const result = await controller.createRole(dto, userEmail);

      // Assert
      expect(result).toEqual(expected);
      expect(mockCreateRole).toHaveBeenCalledTimes(1);
      expect(mockCreateRole).toHaveBeenCalledWith(dto, userEmail);
    });

    it('debería delegar la creación al servicio con los parámetros correctos', async () => {
      // Arrange
      const dto = { name: 'Editor', description: 'Rol editor' };
      const userEmail = 'editor@test.com';
      mockCreateRole.mockResolvedValue({ id: 2, ...dto });

      // Act
      await controller.createRole(dto, userEmail);

      // Assert
      expect(mockCreateRole).toHaveBeenCalledWith(dto, userEmail);
    });
  });

  describe('getAllRoles', () => {
    it('debería retornar la lista de roles', async () => {
      // Arrange
      const queryDTO = { page: 1, limit: 10 };
      const expected = { data: [{ id: 1, name: 'Admin' }], total: 1 };
      mockGetAllRoles.mockResolvedValue(expected);

      // Act
      const result = await controller.getAllRoles(
        queryDTO as unknown as GetRoleListQueryDTO,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetAllRoles).toHaveBeenCalledTimes(1);
    });

    it('debería reenviar el queryDTO al servicio sin modificaciones', async () => {
      // Arrange
      const queryDTO = { page: 2, limit: 5, search: 'admin' };
      mockGetAllRoles.mockResolvedValue({ data: [], total: 0 });

      // Act
      await controller.getAllRoles(queryDTO as unknown as GetRoleListQueryDTO);

      // Assert
      expect(mockGetAllRoles).toHaveBeenCalledWith(queryDTO);
    });
  });

  describe('getRoleById', () => {
    it('debería retornar el rol correspondiente al id del parámetro', async () => {
      // Arrange
      const paramDTO = { id: 42 };
      const expected = {
        id: 42,
        name: 'Supervisor',
        description: 'Rol supervisor',
      };
      mockGetRoleById.mockResolvedValue(expected);

      // Act
      const result = await controller.getRoleById(paramDTO);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetRoleById).toHaveBeenCalledWith(42);
    });

    it('debería extraer el id desde el paramDTO y delegarlo al servicio', async () => {
      // Arrange
      const paramDTO = { id: 7 };
      mockGetRoleById.mockResolvedValue({ id: 7, name: 'Auditor' });

      // Act
      await controller.getRoleById(paramDTO);

      // Assert
      expect(mockGetRoleById).toHaveBeenCalledWith(7);
      expect(mockGetRoleById).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateRole', () => {
    it('debería actualizar un rol y retornar el rol actualizado', async () => {
      // Arrange
      const paramDTO = { id: 3 };
      const dto = { name: 'Gerente', description: 'Rol gerente actualizado' };
      const expected = {
        id: 3,
        name: 'Gerente',
        description: 'Rol gerente actualizado',
      };
      mockUpdateRole.mockResolvedValue(expected);

      // Act
      const result = await controller.updateRole(paramDTO, dto);

      // Assert
      expect(result).toEqual(expected);
      expect(mockUpdateRole).toHaveBeenCalledTimes(1);
      expect(mockUpdateRole).toHaveBeenCalledWith(3, dto, 'system');
    });
  });
});
