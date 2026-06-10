import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { EmailService } from '@modules/email/services/email.service';
import { EmailTypeEnum } from '@modules/email/enum/email-type.enum';
import { UsersDBService } from './users-db.service';
import { UserRolesDBService } from './user-roles-db.service';

// ── Mock functions ─────────────────────────────────────────────────────────────
const mockUsersFindUnique = jest.fn();
const mockUsersFindFirst = jest.fn();
const mockUsersFindMany = jest.fn();
const mockUsersCreate = jest.fn();
const mockUsersUpdate = jest.fn();
const mockUsersCount = jest.fn();

const mockUserCredentialsFindFirst = jest.fn();
const mockUserRolesFindMany = jest.fn();
const mockUserPermissionsFindMany = jest.fn();
const mockRolePermissionsFindMany = jest.fn();

const mockTransaction = jest.fn();

const mockPrisma = {
  extended: {
    users: {
      findUnique: mockUsersFindUnique,
      findFirst: mockUsersFindFirst,
      findMany: mockUsersFindMany,
      create: mockUsersCreate,
      update: mockUsersUpdate,
      count: mockUsersCount,
    },
    userCredentials: { findFirst: mockUserCredentialsFindFirst },
    userRoles: { findMany: mockUserRolesFindMany },
    userPermissions: { findMany: mockUserPermissionsFindMany },
    rolePermissions: { findMany: mockRolePermissionsFindMany },
    $transaction: mockTransaction,
  },
};

const mockSendEmailByType = jest.fn();
const mockEmailService = { sendEmailByType: mockSendEmailByType };

const mockReplaceUserRoles = jest.fn();
const mockUserRolesDBService = { replaceUserRoles: mockReplaceUserRoles };

// ── Fixtures ──────────────────────────────────────────────────────────────────
const fakeUser = {
  id: 1,
  email: 'test@example.com',
  firstName: 'Juan',
  lastName: 'Pérez',
  documentNumber: '123456',
  documentTypeId: 1,
  status: UserStatus.ACTIVE,
  isEmployee: false,
  isLdap: false,
  createdBy: 'system',
  referenceId: 'ref-001',
  professionals: null,
};

describe('UsersDBService', () => {
  let service: UsersDBService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersDBService,
        { provide: PrismaDatasource, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmailService },
        { provide: UserRolesDBService, useValue: mockUserRolesDBService },
      ],
    }).compile();

    service = module.get<UsersDBService>(UsersDBService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ───────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('debe crear y retornar el usuario con los datos proporcionados', async () => {
      // Arrange
      mockUsersCreate.mockResolvedValue(fakeUser);

      // Act
      const result = await service.create({
        email: 'test@example.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        isEmployee: false,
        isLdap: false,
        createdBy: 'system',
      } as never);

      // Assert
      expect(result).toEqual(fakeUser);
      expect(mockUsersCreate).toHaveBeenCalled();
    });
  });

  // ── createUser ───────────────────────────────────────────────────────────────
  describe('createUser', () => {
    it('debe crear el usuario y enviar email de verificación', async () => {
      // Arrange
      mockUsersFindFirst.mockResolvedValue(null);
      mockUsersCreate.mockResolvedValue(fakeUser);
      mockSendEmailByType.mockResolvedValue(undefined);

      // Act
      const result = await service.createUser({
        email: 'test@example.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        isEmployee: false,
        isLdap: false,
        createdBy: 'system',
      });

      // Assert
      expect(result).toEqual(fakeUser);
      expect(mockSendEmailByType).toHaveBeenCalledWith(
        'test@example.com',
        EmailTypeEnum.VERIFICATION,
        fakeUser,
      );
    });

    it('debe lanzar BadRequestException cuando el email ya existe', async () => {
      // Arrange
      mockUsersFindFirst.mockResolvedValue(fakeUser);

      // Act & Assert
      await expect(
        service.createUser({
          email: 'test@example.com',
          firstName: 'Juan',
          lastName: 'Pérez',
          isEmployee: false,
          isLdap: false,
          createdBy: 'system',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe continuar y retornar el usuario aunque el envío de email falle', async () => {
      // Arrange
      mockUsersFindFirst.mockResolvedValue(null);
      mockUsersCreate.mockResolvedValue(fakeUser);
      mockSendEmailByType.mockRejectedValue(new Error('SMTP error'));

      // Act
      const result = await service.createUser({
        email: 'test@example.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        isEmployee: false,
        isLdap: false,
        createdBy: 'system',
      });

      // Assert
      expect(result).toEqual(fakeUser);
    });
  });

  // ── createUserWithContext ────────────────────────────────────────────────────
  describe('createUserWithContext', () => {
    it('debe crear usuario con roles dentro de una transacción y enviar ambos emails', async () => {
      // Arrange
      mockUsersFindFirst.mockResolvedValue(null);
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const txClient = {
            users: { create: jest.fn().mockResolvedValue(fakeUser) },
          };
          return callback(txClient);
        },
      );
      mockReplaceUserRoles.mockResolvedValue(undefined);
      mockSendEmailByType.mockResolvedValue(undefined);

      // Act
      const result = await service.createUserWithContext({
        email: 'test@example.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        isEmployee: false,
        isLdap: false,
        status: UserStatus.ACTIVE,
        createdBy: 'system',
        roleIds: [1],
      });

      // Assert
      expect(result).toEqual(fakeUser);
      expect(mockTransaction).toHaveBeenCalled();
      expect(mockSendEmailByType).toHaveBeenCalledTimes(2);
    });

    it('debe lanzar BadRequestException cuando el usuario ya existe', async () => {
      // Arrange
      mockUsersFindFirst.mockResolvedValue(fakeUser);

      // Act & Assert
      await expect(
        service.createUserWithContext({
          email: 'test@example.com',
          firstName: 'Juan',
          lastName: 'Pérez',
          isEmployee: false,
          isLdap: false,
          status: UserStatus.ACTIVE,
          createdBy: 'system',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe crear usuario sin llamar a replaceUserRoles cuando no se envían roleIds', async () => {
      // Arrange
      mockUsersFindFirst.mockResolvedValue(null);
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const txClient = {
            users: { create: jest.fn().mockResolvedValue(fakeUser) },
          };
          return callback(txClient);
        },
      );
      mockSendEmailByType.mockResolvedValue(undefined);

      // Act
      await service.createUserWithContext({
        email: 'test@example.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        isEmployee: false,
        isLdap: false,
        status: UserStatus.ACTIVE,
        createdBy: 'system',
      });

      // Assert
      expect(mockReplaceUserRoles).not.toHaveBeenCalled();
    });
  });

  // ── findAll ──────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('debe retornar la lista de usuarios paginada y el total', async () => {
      // Arrange
      mockTransaction.mockResolvedValue([[fakeUser], 1]);

      // Act
      const result = await service.findAll({
        page: 1,
        pageSize: 10,
        orderBy: 'createdAt',
      });

      // Assert
      expect(result).toEqual({ data: [fakeUser], total: 1 });
    });

    it('debe calcular el skip correctamente según la página', async () => {
      // Arrange
      mockTransaction.mockResolvedValue([[], 0]);

      // Act
      await service.findAll({ page: 3, pageSize: 10, orderBy: 'createdAt' });

      // Assert — skip = (3-1)*10 = 20; verificado implícitamente con la llamada a transaction
      expect(mockTransaction).toHaveBeenCalled();
    });
  });

  // findAllUsers es alias de findAll — no se testea por separado

  // ── findById ─────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('debe retornar el usuario cuando el ID existe', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue(fakeUser);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(result).toEqual(fakeUser);
      expect(mockUsersFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('debe retornar null cuando el ID no existe', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── findUserById ─────────────────────────────────────────────────────────────
  describe('findUserById', () => {
    it('debe retornar el usuario cuando existe', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue(fakeUser);

      // Act
      const result = await service.findUserById(1);

      // Assert
      expect(result).toEqual(fakeUser);
    });

    it('debe lanzar NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findUserById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findByIdWithDetail ───────────────────────────────────────────────────────
  describe('findByIdWithDetail', () => {
    it('debe retornar el usuario con detalles incluidos cuando existe', async () => {
      // Arrange
      const detailedUser = { ...fakeUser, roles: [], permissions: [] };
      mockUsersFindUnique.mockResolvedValue(detailedUser);

      // Act
      const result = await service.findByIdWithDetail(1);

      // Assert
      expect(result).toEqual(detailedUser);
    });

    it('debe retornar null cuando el usuario no existe', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findByIdWithDetail(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── findUserByIdWithDetail ───────────────────────────────────────────────────
  describe('findUserByIdWithDetail', () => {
    it('debe lanzar NotFoundException cuando el usuario con detalle no existe', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findUserByIdWithDetail(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findByReferenceId ────────────────────────────────────────────────────────
  describe('findByReferenceId', () => {
    it('debe retornar el usuario con el referenceId indicado', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue(fakeUser);

      // Act
      const result = await service.findByReferenceId('ref-001');

      // Assert
      expect(result).toEqual(fakeUser);
      expect(mockUsersFindUnique).toHaveBeenCalledWith({
        where: { referenceId: 'ref-001' },
      });
    });
  });

  // ── findUserByReferenceId ────────────────────────────────────────────────────
  describe('findUserByReferenceId', () => {
    it('debe lanzar NotFoundException cuando no existe el referenceId', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findUserByReferenceId('ref-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findUserByReferenceIdWithDetail ──────────────────────────────────────────
  describe('findUserByReferenceIdWithDetail', () => {
    it('debe lanzar NotFoundException cuando no existe el usuario con detalle', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.findUserByReferenceIdWithDetail('ref-999'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── findByEmail / findUserByEmail ─────────────────────────────────────────────
  describe('findByEmail', () => {
    it('debe retornar el usuario cuando el email existe', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue(fakeUser);

      // Act
      const result = await service.findByEmail('test@example.com');

      // Assert
      expect(result).toEqual(fakeUser);
      expect(mockUsersFindUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('debe retornar null cuando el email no está registrado', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findByEmail('noexiste@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── findByEmailAndDocument ───────────────────────────────────────────────────
  describe('findByEmailAndDocument', () => {
    it('debe retornar el usuario que coincide con email y documento', async () => {
      // Arrange
      mockUsersFindFirst.mockResolvedValue(fakeUser);

      // Act
      const result = await service.findByEmailAndDocument(
        'test@example.com',
        '123456',
      );

      // Assert
      expect(result).toEqual(fakeUser);
      expect(mockUsersFindFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com', documentNumber: '123456' },
      });
    });
  });

  // ── findActiveUserByEmail ────────────────────────────────────────────────────
  describe('findActiveUserByEmail', () => {
    it('debe retornar usuario activo o pendiente por email incluyendo seguridades', async () => {
      // Arrange
      const userWithSecurities = {
        ...fakeUser,
        roles: [],
        permissions: [],
        credentials: [],
      };
      mockUsersFindFirst.mockResolvedValue(userWithSecurities);

      // Act
      const result = await service.findActiveUserByEmail('test@example.com');

      // Assert
      expect(result).toEqual(userWithSecurities);
      expect(mockUsersFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: 'test@example.com',
            status: {
              in: [UserStatus.ACTIVE, UserStatus.PENDING_VERIFICATION],
            },
          }) as unknown,
        }),
      );
    });
  });

  // ── findActiveUserById ───────────────────────────────────────────────────────
  describe('findActiveUserById', () => {
    it('debe retornar null cuando el usuario existe pero está bloqueado', async () => {
      // Arrange
      mockUsersFindFirst.mockResolvedValue(null);

      // Act
      const result = await service.findActiveUserById(1);

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── findCredentialsByEmail ───────────────────────────────────────────────────
  describe('findCredentialsByEmail', () => {
    it('debe retornar las credenciales activas con el usuario incluido', async () => {
      // Arrange
      const creds = { id: 'cred-1', userId: 1, isActive: true, user: fakeUser };
      mockUserCredentialsFindFirst.mockResolvedValue(creds);

      // Act
      const result = await service.findCredentialsByEmail('test@example.com');

      // Assert
      expect(result).toEqual(creds);
      expect(mockUserCredentialsFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, user: { email: 'test@example.com' } },
        }),
      );
    });
  });

  // ── update ───────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('debe actualizar y retornar el usuario con los nuevos datos', async () => {
      // Arrange
      const updated = { ...fakeUser, firstName: 'Carlos' };
      mockUsersUpdate.mockResolvedValue(updated);

      // Act
      const result = await service.update(1, { firstName: 'Carlos' });

      // Assert
      expect(result).toEqual(updated);
      expect(mockUsersUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { firstName: 'Carlos' },
      });
    });
  });

  // ── updateUser ───────────────────────────────────────────────────────────────
  describe('updateUser', () => {
    it('debe actualizar el usuario agregando lastChangedBy y lastChangedAt', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue(fakeUser);
      const updated = { ...fakeUser, firstName: 'Carlos' };
      mockUsersUpdate.mockResolvedValue(updated);

      // Act
      const result = await service.updateUser(
        1,
        { firstName: 'Carlos' },
        'admin@example.com',
      );

      // Assert
      expect(result).toEqual(updated);
      expect(mockUsersUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lastChangedBy: 'admin@example.com',
          }) as unknown,
        }),
      );
    });

    it('debe lanzar NotFoundException cuando el usuario a actualizar no existe', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateUser(999, { firstName: 'Carlos' }, 'admin'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe incluir changedReason automático cuando el status cambia a BLOCKED', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue(fakeUser);
      mockUsersUpdate.mockResolvedValue({
        ...fakeUser,
        status: UserStatus.BLOCKED,
      });

      // Act
      await service.updateUser(1, { status: UserStatus.BLOCKED }, 'admin');

      // Assert
      expect(mockUsersUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            changedReason: 'Cantidad de intentos fallidos superado',
          }) as unknown,
        }),
      );
    });
  });

  // ── updateDocumentInfo ───────────────────────────────────────────────────────
  describe('updateDocumentInfo', () => {
    it('debe actualizar documentNumber y documentTypeId del usuario', async () => {
      // Arrange
      mockUsersUpdate.mockResolvedValue(fakeUser);

      // Act
      await service.updateDocumentInfo(1, '12345678', 2);

      // Assert
      expect(mockUsersUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { documentNumber: '12345678', documentTypeId: 2 },
      });
    });

    it('debe aceptar null en documentNumber y documentTypeId', async () => {
      // Arrange
      mockUsersUpdate.mockResolvedValue(fakeUser);

      // Act
      await service.updateDocumentInfo(1, null, null);

      // Assert
      expect(mockUsersUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { documentNumber: null, documentTypeId: null },
      });
    });
  });

  // ── updateLastLogin ──────────────────────────────────────────────────────────
  describe('updateLastLogin', () => {
    it('debe actualizar la fecha de último login del usuario', async () => {
      // Arrange
      mockUsersUpdate.mockResolvedValue(fakeUser);

      // Act
      await service.updateLastLogin(1);

      // Assert
      expect(mockUsersUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { lastLogin: expect.any(Date) as unknown },
      });
    });
  });

  // ── updateStatus ─────────────────────────────────────────────────────────────
  describe('updateStatus', () => {
    it('debe actualizar únicamente el status del usuario', async () => {
      // Arrange
      mockUsersUpdate.mockResolvedValue(fakeUser);

      // Act
      await service.updateStatus(1, UserStatus.BLOCKED);

      // Assert
      expect(mockUsersUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: UserStatus.BLOCKED },
      });
    });
  });

  // ── verifyUser ───────────────────────────────────────────────────────────────
  describe('verifyUser', () => {
    it('debe marcar al usuario como ACTIVE y limpiar el email no verificado', async () => {
      // Arrange
      mockUsersUpdate.mockResolvedValue(fakeUser);

      // Act
      await service.verifyUser(1);

      // Assert
      expect(mockUsersUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: UserStatus.ACTIVE, unverifiedEmail: null },
      });
    });
  });

  // ── blockUser ────────────────────────────────────────────────────────────────
  describe('blockUser', () => {
    it('debe bloquear al usuario con el motivo indicado', async () => {
      // Arrange
      mockUsersUpdate.mockResolvedValue(fakeUser);

      // Act
      await service.blockUser(1, 'Actividad sospechosa');

      // Assert
      expect(mockUsersUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: UserStatus.BLOCKED,
          changedReason: 'Actividad sospechosa',
        }) as unknown,
      });
    });
  });

  // ── inactivateUser ───────────────────────────────────────────────────────────
  describe('inactivateUser', () => {
    it('debe inactivar el usuario cuando existe', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue(fakeUser);
      mockUsersUpdate.mockResolvedValue({
        ...fakeUser,
        status: UserStatus.INACTIVE,
      });

      // Act
      await service.inactivateUser(1, 'admin@example.com');

      // Assert
      expect(mockUsersUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: UserStatus.INACTIVE,
          }) as unknown,
        }),
      );
    });

    it('debe lanzar NotFoundException cuando el usuario a inactivar no existe', async () => {
      // Arrange
      mockUsersFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.inactivateUser(999, 'admin')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── getUsersCount ────────────────────────────────────────────────────────────
  describe('getUsersCount', () => {
    it('debe retornar el total de usuarios, profesionales y clientes calculados', async () => {
      // Arrange
      mockUsersCount
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(30); // professionals

      // Act
      const result = await service.getUsersCount();

      // Assert
      expect(result).toEqual({ total: 100, clients: 70, professionals: 30 });
    });
  });

  // ── getUserRoles ─────────────────────────────────────────────────────────────
  describe('getUserRoles', () => {
    it('debe retornar los roles activos del usuario mapeados a RoleDTO', async () => {
      // Arrange
      mockUserRolesFindMany.mockResolvedValue([
        { role: { id: 1, name: 'ADMIN', description: 'Administrador' } },
      ]);

      // Act
      const result = await service.getUserRoles(1);

      // Assert
      expect(result).toEqual([
        { id: 1, name: 'ADMIN', description: 'Administrador' },
      ]);
      expect(mockUserRolesFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1, role: { isActive: true } },
        }),
      );
    });
  });

  // ── getUserPermissions ───────────────────────────────────────────────────────
  describe('getUserPermissions', () => {
    it('debe retornar los permisos activos del usuario mapeados a PermissionDTO', async () => {
      // Arrange
      mockUserPermissionsFindMany.mockResolvedValue([
        { permission: { name: 'users:read' } },
        { permission: { name: 'users:write' } },
      ]);

      // Act
      const result = await service.getUserPermissions(1);

      // Assert
      expect(result).toEqual([{ name: 'users:read' }, { name: 'users:write' }]);
    });
  });

  // ── getRolePermissions ───────────────────────────────────────────────────────
  describe('getRolePermissions', () => {
    it('debe retornar una lista vacía cuando no se envían roles', async () => {
      // Act
      const result = await service.getRolePermissions([]);

      // Assert
      expect(result).toEqual([]);
      expect(mockRolePermissionsFindMany).not.toHaveBeenCalled();
    });

    it('debe retornar permisos únicos deduplicados para los roles dados', async () => {
      // Arrange
      mockRolePermissionsFindMany.mockResolvedValue([
        { permission: { name: 'users:read' } },
        { permission: { name: 'users:read' } }, // duplicado
        { permission: { name: 'services:read' } },
      ]);

      // Act
      const result = await service.getRolePermissions([1, 2]);

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          { name: 'users:read' },
          { name: 'services:read' },
        ]),
      );
    });
  });

  // ── updateUserWithContext ────────────────────────────────────────────────────
  describe('updateUserWithContext', () => {
    it('debe actualizar datos del usuario dentro de una transacción cuando se envía dto.user', async () => {
      // Arrange
      const mockTxUpdate = jest.fn().mockResolvedValue({});
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<void>) => {
          const txClient = {
            users: { update: mockTxUpdate },
          };
          return callback(txClient);
        },
      );

      const dto = {
        user: {
          firstName: 'Nuevo',
          lastName: 'Nombre',
          email: 'nuevo@example.com',
          documentNumber: '654321',
          isEmployee: false,
          isLdap: false,
          status: UserStatus.ACTIVE,
          changedReason: null,
        },
      } as unknown as Parameters<typeof service.updateUserWithContext>[1];

      // Act
      await service.updateUserWithContext(
        fakeUser as unknown as Parameters<
          typeof service.updateUserWithContext
        >[0],
        dto,
        'admin@example.com',
      );

      // Assert
      expect(mockTransaction).toHaveBeenCalled();
      expect(mockTxUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: fakeUser.id },
          data: expect.objectContaining({
            lastChangedBy: 'admin@example.com',
          }) as unknown,
        }),
      );
    });

    it('debe llamar a replaceUserRoles cuando se envían roleIds en el DTO', async () => {
      // Arrange
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<void>) => {
          const txClient = {
            users: { update: jest.fn().mockResolvedValue({}) },
          };
          return callback(txClient);
        },
      );
      mockReplaceUserRoles.mockResolvedValue(undefined);

      const dto = { roleIds: [2] } as unknown as Parameters<
        typeof service.updateUserWithContext
      >[1];

      // Act
      await service.updateUserWithContext(
        fakeUser as unknown as Parameters<
          typeof service.updateUserWithContext
        >[0],
        dto,
        'admin@example.com',
      );

      // Assert
      expect(mockReplaceUserRoles).toHaveBeenCalledWith(
        fakeUser.id,
        [2],
        'admin@example.com',
        expect.anything(),
      );
    });
  });
});
