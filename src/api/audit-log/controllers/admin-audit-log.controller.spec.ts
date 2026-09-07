import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { PERMISSIONS_KEY } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { AdminAuditLogController } from './admin-audit-log.controller';
import { AuditLogService } from '../services/audit-log.service';
import { GetAuditLogsQueryDTO } from '../dtos/request';
import { AuditLogsListResponseDTO } from '../dtos/response';

const mockList = jest.fn();

describe('AdminAuditLogController', () => {
  let controller: AdminAuditLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAuditLogController],
      providers: [{ provide: AuditLogService, useValue: { list: mockList } }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AdminAuditLogController>(AdminAuditLogController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('debe requerir el permiso de auditoría del sistema o admin:all', () => {
      // Arrange & Act
      const requiredPermissions = new Reflector().get<string[]>(
        PERMISSIONS_KEY,
        // eslint-disable-next-line @typescript-eslint/unbound-method -- solo se lee su metadata, nunca se invoca desatado de la instancia
        controller.list,
      );

      // Assert
      expect(requiredPermissions).toEqual([
        PERMISSIONS.SYSTEM.AUDIT_VIEW,
        PERMISSIONS.ADMIN.ALL,
      ]);
    });

    it('debe delegar el listado al service con el query recibido', async () => {
      // Arrange
      const query: GetAuditLogsQueryDTO = {
        tableName: 'payments',
      } as GetAuditLogsQueryDTO;
      const expected: AuditLogsListResponseDTO = {
        data: [],
        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
      };
      mockList.mockResolvedValue(expected);

      // Act
      const result = await controller.list(query);

      // Assert
      expect(mockList).toHaveBeenCalledWith(query);
      expect(result).toBe(expected);
    });
  });
});
