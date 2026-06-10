import { Test, TestingModule } from '@nestjs/testing';
import { Users } from '@prisma/client';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { MerchantContextGuard } from '@modules/auth/guards/merchant-context.guard';
import { IMerchantContext } from '@common/interfaces/merchant-context.interface';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { UsersController } from './users.controller';
import { UsersApiService } from '@api/users/services/users-api.service';
import * as DTO from '@api/users/dtos';
import { UpdateEditContextRequestDTO } from '@api/users/dtos/request/edit-context.request.dto';

// NOTE: @Param('id', ParseIntPipe) en líneas 130, 143, 153, 163 viola la regla DTO del proyecto.
// En unit tests el pipe no se ejecuta — los valores se pasan directamente como number.

const mockFindAll = jest.fn();
const mockGetEditContext = jest.fn();
const mockUpdateEditContext = jest.fn();
const mockFindOneByReference = jest.fn();
const mockUpdateByReference = jest.fn();
const mockDeleteByReference = jest.fn();
const mockFindOne = jest.fn();
const mockUpdate = jest.fn();
const mockBlock = jest.fn();
const mockUnblock = jest.fn();

const mockMerchantCtx = {
  merchantCode: 'MC001',
  ruc: '80012345-6',
  level: 'BRANCH' as never,
  branchCode: 'BR001',
} as unknown as IMerchantContext;

const mockJwtUser = {
  id: 1,
  email: 'user@test.com',
} as unknown as IUserDataOnJwt;
const mockOperatorUser = { id: 1, email: 'admin@test.com' } as unknown as Users;

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersApiService,
          useValue: {
            findAll: mockFindAll,
            getEditContext: mockGetEditContext,
            updateEditContext: mockUpdateEditContext,
            findOneByReference: mockFindOneByReference,
            updateByReference: mockUpdateByReference,
            deleteByReference: mockDeleteByReference,
            findOne: mockFindOne,
            update: mockUpdate,
            block: mockBlock,
            unblock: mockUnblock,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(MerchantContextGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('debe retornar la lista de usuarios con el contexto de merchant y usuario autenticado', async () => {
      // Arrange
      const query = {
        page: 1,
        pageSize: 10,
      } as unknown as DTO.ListUsersRequestDTO;
      const expected: DTO.UsersListResponseDTO = {
        data: [
          { id: 1, email: 'test@test.com' } as unknown as DTO.UserResponseDTO,
        ],
        pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
      };
      mockFindAll.mockResolvedValue(expected);

      // Act
      const result = await controller.findAll(
        query,
        mockMerchantCtx,
        mockJwtUser,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindAll).toHaveBeenCalledWith(
        query,
        mockMerchantCtx,
        mockJwtUser,
      );
    });
  });

  describe('getEditContext', () => {
    it('debe retornar el contexto de edición del usuario por referenceId', async () => {
      // Arrange
      const referenceId = 'ref-001';
      const expected = { referenceId, roles: [], permissions: [] };
      mockGetEditContext.mockResolvedValue(expected);

      // Act
      const result = await controller.getEditContext(referenceId);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetEditContext).toHaveBeenCalledWith(referenceId);
    });
  });

  describe('updateEditContext', () => {
    it('debe actualizar el contexto de edición pasando el operador que realiza el cambio', async () => {
      // Arrange
      const referenceId = 'ref-001';
      const dto = { roleIds: [1, 2] } as unknown as UpdateEditContextRequestDTO;
      const expected = { referenceId, updated: true };
      mockUpdateEditContext.mockResolvedValue(expected);

      // Act
      const result = await controller.updateEditContext(
        referenceId,
        dto,
        mockOperatorUser,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockUpdateEditContext).toHaveBeenCalledWith(
        referenceId,
        dto,
        mockOperatorUser,
      );
    });
  });

  describe('findOneByReference', () => {
    it('debe retornar el usuario por su referenceId', async () => {
      // Arrange
      const referenceId = 'ref-001';
      const expected = {
        id: 1,
        referenceId,
        email: 'test@test.com',
      } as unknown as DTO.UserResponseDTO;
      mockFindOneByReference.mockResolvedValue(expected);

      // Act
      const result = await controller.findOneByReference(referenceId);

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindOneByReference).toHaveBeenCalledWith(referenceId);
    });
  });

  describe('updateByReference', () => {
    it('debe actualizar el usuario por referenceId pasando el email del operador', async () => {
      // Arrange
      const referenceId = 'ref-001';
      const dto = {
        firstName: 'NuevoNombre',
      } as unknown as DTO.UpdateUserRequestDTO;
      const expected = {
        id: 1,
        firstName: 'NuevoNombre',
      } as unknown as DTO.UserResponseDTO;
      mockUpdateByReference.mockResolvedValue(expected);

      // Act
      const result = await controller.updateByReference(
        referenceId,
        dto,
        mockOperatorUser,
      );

      // Assert
      expect(result).toEqual(expected);
      expect(mockUpdateByReference).toHaveBeenCalledWith(
        referenceId,
        dto,
        'admin@test.com',
      );
    });
  });

  describe('deleteByReference', () => {
    it('debe eliminar el usuario por referenceId pasando el email del operador', async () => {
      // Arrange
      const referenceId = 'ref-001';
      mockDeleteByReference.mockResolvedValue(undefined);

      // Act
      await controller.deleteByReference(referenceId, mockOperatorUser);

      // Assert
      expect(mockDeleteByReference).toHaveBeenCalledWith(
        referenceId,
        'admin@test.com',
      );
    });
  });

  describe('findOne', () => {
    it('debe retornar el usuario por su ID numérico', async () => {
      // Arrange
      const expected = {
        id: 1,
        email: 'test@test.com',
      } as unknown as DTO.UserResponseDTO;
      mockFindOne.mockResolvedValue(expected);

      // Act
      const result = await controller.findOne(1);

      // Assert
      expect(result).toEqual(expected);
      expect(mockFindOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('debe actualizar el usuario por ID pasando el email del operador', async () => {
      // Arrange
      const dto = {
        lastName: 'NuevoApellido',
      } as unknown as DTO.UpdateUserRequestDTO;
      const expected = {
        id: 1,
        lastName: 'NuevoApellido',
      } as unknown as DTO.UserResponseDTO;
      mockUpdate.mockResolvedValue(expected);

      // Act
      const result = await controller.update(1, dto, mockOperatorUser);

      // Assert
      expect(result).toEqual(expected);
      expect(mockUpdate).toHaveBeenCalledWith(1, dto, 'admin@test.com');
    });
  });

  describe('block', () => {
    it('debe bloquear el usuario pasando el email del operador como auditoría', async () => {
      // Arrange
      const dto = {
        reason: 'Incumplimiento de términos',
      };
      const expected = {
        id: 1,
        isBlocked: true,
      } as unknown as DTO.UserResponseDTO;
      mockBlock.mockResolvedValue(expected);

      // Act
      const result = await controller.block(1, dto, mockOperatorUser);

      // Assert
      expect(result).toEqual(expected);
      expect(mockBlock).toHaveBeenCalledWith(1, dto, 'admin@test.com');
    });
  });

  describe('unblock', () => {
    it('debe desbloquear el usuario pasando el email del operador como auditoría', async () => {
      // Arrange
      const dto = {
        reason: 'Resolvió el incumplimiento',
      };
      const expected = {
        id: 1,
        isBlocked: false,
      } as unknown as DTO.UserResponseDTO;
      mockUnblock.mockResolvedValue(expected);

      // Act
      const result = await controller.unblock(1, dto, mockOperatorUser);

      // Assert
      expect(result).toEqual(expected);
      expect(mockUnblock).toHaveBeenCalledWith(1, dto, 'admin@test.com');
    });
  });
});
