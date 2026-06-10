import { Test, TestingModule } from '@nestjs/testing';
import { UserStatus } from '@prisma/client';
import { UsersApiService } from './users-api.service';
import { UsersDBService } from '@modules/users-db/services/users-db.service';
import { UserRolesDBService } from '@modules/users-db/services/user-roles-db.service';
import { UserHelper } from '../helpers/user.helper';

const mockFindAllUsers = jest.fn();
const mockFindUserByIdWithDetail = jest.fn();
const mockFindUserByReferenceIdWithDetail = jest.fn();
const mockUpdateUserWithContext = jest.fn();
const mockUpdateUser = jest.fn();
const mockFindUserByReferenceId = jest.fn();
const mockInactivateUser = jest.fn();
const mockGetUserRoleIds = jest.fn();
const mockGetAllAvailableRoles = jest.fn();

const mockUserBase = {
  id: 1,
  referenceId: 'ref-001',
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@test.com',
  documentNumber: '123456',
  phoneNumber: '0981000000',
  status: UserStatus.ACTIVE,
  isEmployee: false,
  isLdap: false,
  changedReason: null,
};

const mockUserResponse = {
  id: 1,
  referenceId: 'ref-001',
  email: 'juan@test.com',
  firstName: 'Juan',
  lastName: 'Pérez',
  status: UserStatus.ACTIVE,
};

const mockUserDetailResponse = {
  ...mockUserResponse,
  documentNumber: '123456',
  phoneNumber: '0981000000',
};

const mockMerchantCtx = {
  merchantCode: 'MC001',
  ruc: '80012345-6',
  level: 'BRANCH' as never,
  groupingId: null as never,
  branchCode: 'BR001',
};

const mockJwtUser = { referenceId: 'op-ref-001', email: 'operador@test.com' };

describe('UsersApiService', () => {
  let service: UsersApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersApiService,
        {
          provide: UsersDBService,
          useValue: {
            findAllUsers: mockFindAllUsers,
            findUserByIdWithDetail: mockFindUserByIdWithDetail,
            findUserByReferenceIdWithDetail:
              mockFindUserByReferenceIdWithDetail,
            updateUserWithContext: mockUpdateUserWithContext,
            updateUser: mockUpdateUser,
            findUserByReferenceId: mockFindUserByReferenceId,
            inactivateUser: mockInactivateUser,
          },
        },
        {
          provide: UserRolesDBService,
          useValue: {
            getUserRoleIds: mockGetUserRoleIds,
            getAllAvailableRoles: mockGetAllAvailableRoles,
          },
        },
      ],
    }).compile();

    service = module.get<UsersApiService>(UsersApiService);

    jest
      .spyOn(UserHelper, 'mapUserToResponse')
      .mockReturnValue(mockUserResponse as never);
    jest
      .spyOn(UserHelper, 'mapUserToDetailResponse')
      .mockReturnValue(mockUserDetailResponse as never);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('debe retornar lista paginada de usuarios con paginación calculada correctamente', async () => {
      // Arrange
      const dto = { page: 1, pageSize: 10 } as never;
      mockFindAllUsers.mockResolvedValue({ data: [mockUserBase], total: 1 });

      // Act
      const result = await service.findAll(
        dto,
        mockMerchantCtx,
        mockJwtUser as never,
      );

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('debe usar valores por defecto cuando page y pageSize no se proveen', async () => {
      // Arrange
      const dto = {} as never;
      mockFindAllUsers.mockResolvedValue({ data: [], total: 0 });

      // Act
      await service.findAll(dto, mockMerchantCtx, mockJwtUser as never);

      // Assert
      expect(mockFindAllUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 10,
          orderBy: 'createdAt',
          orderDir: 'desc',
        }),
      );
    });

    it('debe pasar el operatorReferenceId del JWT al servicio para excluir al propio operador', async () => {
      // Arrange
      const dto = {} as never;
      mockFindAllUsers.mockResolvedValue({ data: [], total: 0 });

      // Act
      await service.findAll(dto, mockMerchantCtx, mockJwtUser as never);

      // Assert
      expect(mockFindAllUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          operatorReferenceId: mockJwtUser.referenceId,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('debe retornar el detalle del usuario cuando el ID existe', async () => {
      // Arrange
      mockFindUserByIdWithDetail.mockResolvedValue(mockUserBase);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(mockFindUserByIdWithDetail).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUserDetailResponse);
    });
  });

  describe('findOneByReference', () => {
    it('debe retornar el detalle del usuario cuando el referenceId existe', async () => {
      // Arrange
      mockFindUserByReferenceIdWithDetail.mockResolvedValue(mockUserBase);

      // Act
      const result = await service.findOneByReference('ref-001');

      // Assert
      expect(mockFindUserByReferenceIdWithDetail).toHaveBeenCalledWith(
        'ref-001',
      );
      expect(result).toEqual(mockUserDetailResponse);
    });
  });

  describe('getEditContext', () => {
    it('debe retornar roles asignados y disponibles correctamente separados', async () => {
      // Arrange
      const availableRoles = [
        {
          id: 1,
          name: 'admin',
          displayName: 'Administrador',
          description: 'Full access',
        },
        {
          id: 2,
          name: 'operator',
          displayName: 'Operador',
          description: 'Partial access',
        },
        {
          id: 3,
          name: 'viewer',
          displayName: 'Visualizador',
          description: 'Read only',
        },
      ];
      mockFindUserByReferenceIdWithDetail.mockResolvedValue({
        ...mockUserBase,
        id: 1,
      });
      mockGetUserRoleIds.mockResolvedValue([1, 3]); // tiene admin y viewer asignados
      mockGetAllAvailableRoles.mockResolvedValue(availableRoles);

      // Act
      const result = await service.getEditContext('ref-001');

      // Assert
      expect(result.roles.assigned).toHaveLength(2);
      expect(result.roles.assigned.map((r) => r.id)).toContain(1);
      expect(result.roles.assigned.map((r) => r.id)).toContain(3);
      expect(result.roles.available).toHaveLength(1);
      expect(result.roles.available[0].id).toBe(2);
    });

    it('debe incluir los datos del usuario en el contexto', async () => {
      // Arrange
      mockFindUserByReferenceIdWithDetail.mockResolvedValue(mockUserBase);
      mockGetUserRoleIds.mockResolvedValue([]);
      mockGetAllAvailableRoles.mockResolvedValue([]);

      // Act
      const result = await service.getEditContext('ref-001');

      // Assert
      expect(result.user.id).toBe(mockUserBase.id);
      expect(result.user.email).toBe(mockUserBase.email);
      expect(result.user.referenceId).toBe(mockUserBase.referenceId);
    });
  });

  describe('updateEditContext', () => {
    it('debe actualizar el contexto del usuario y retornar mensaje de confirmación', async () => {
      // Arrange
      const dto = { user: { firstName: 'Carlos' }, roleIds: [1, 2] } as never;
      mockFindUserByReferenceIdWithDetail.mockResolvedValue(mockUserBase);
      mockUpdateUserWithContext.mockResolvedValue(undefined);

      // Act
      const result = await service.updateEditContext('ref-001', dto, {
        email: 'op@test.com',
      });

      // Assert
      expect(mockUpdateUserWithContext).toHaveBeenCalledWith(
        mockUserBase,
        dto,
        'op@test.com',
      );
      expect(result.message).toBe('Usuario actualizado correctamente');
    });
  });

  describe('update', () => {
    it('debe actualizar el usuario y retornar el DTO de respuesta mapeado', async () => {
      // Arrange
      const dto = { email: 'nuevo@test.com', firstName: 'Carlos' } as never;
      mockUpdateUser.mockResolvedValue({
        ...mockUserBase,
        email: 'nuevo@test.com',
      });

      // Act
      const result = await service.update(1, dto, 'operador@test.com');

      // Assert
      expect(mockUpdateUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ email: 'nuevo@test.com' }),
        'operador@test.com',
      );
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('updateByReference', () => {
    it('debe buscar por referencia, actualizar y retornar el DTO mapeado', async () => {
      // Arrange
      const dto = { firstName: 'Pedro' } as never;
      mockFindUserByReferenceId.mockResolvedValue(mockUserBase);
      mockUpdateUser.mockResolvedValue({ ...mockUserBase, firstName: 'Pedro' });

      // Act
      const result = await service.updateByReference(
        'ref-001',
        dto,
        'operador@test.com',
      );

      // Assert
      expect(mockFindUserByReferenceId).toHaveBeenCalledWith('ref-001');
      expect(mockUpdateUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({}),
        'operador@test.com',
      );
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('deleteByReference', () => {
    it('debe inactivar al usuario encontrado por referenceId', async () => {
      // Arrange
      mockFindUserByReferenceId.mockResolvedValue(mockUserBase);
      mockInactivateUser.mockResolvedValue(undefined);

      // Act
      await service.deleteByReference('ref-001', 'operador@test.com');

      // Assert
      expect(mockFindUserByReferenceId).toHaveBeenCalledWith('ref-001');
      expect(mockInactivateUser).toHaveBeenCalledWith(1, 'operador@test.com');
    });
  });

  describe('block', () => {
    it('debe bloquear al usuario con la razón indicada', async () => {
      // Arrange
      const dto = { reason: 'Actividad sospechosa' } as never;
      mockUpdateUser.mockResolvedValue({
        ...mockUserBase,
        status: UserStatus.BLOCKED,
      });

      // Act
      const result = await service.block(1, dto, 'admin@test.com');

      // Assert
      expect(mockUpdateUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: UserStatus.BLOCKED,
          changedReason: 'Actividad sospechosa',
        }),
        'admin@test.com',
      );
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('unblock', () => {
    it('debe desbloquear al usuario y cambiar su estado a ACTIVE', async () => {
      // Arrange
      const dto = { reason: 'Revisión completada' } as never;
      mockUpdateUser.mockResolvedValue({
        ...mockUserBase,
        status: UserStatus.ACTIVE,
      });

      // Act
      const result = await service.unblock(1, dto, 'admin@test.com');

      // Assert
      expect(mockUpdateUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: UserStatus.ACTIVE,
          changedReason: 'Revisión completada',
        }),
        'admin@test.com',
      );
      expect(result).toEqual(mockUserResponse);
    });
  });
});
