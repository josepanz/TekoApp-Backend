import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { PERMISSIONS_KEY } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { PaymentStatus } from '@prisma/client';
import { IDownloadResponse } from '@core/interceptors/file-download.interceptor';
import { AdminPaymentsController } from './admin-payments.controller';
import { PaymentApiService } from '../services/payments.service';
import { PaymentListQueryDTO } from '../dtos/request';

const mockExportToCsv = jest.fn();

describe('AdminPaymentsController', () => {
  let controller: AdminPaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminPaymentsController],
      providers: [
        {
          provide: PaymentApiService,
          useValue: { exportToCsv: mockExportToCsv },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AdminPaymentsController>(AdminPaymentsController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('export', () => {
    it('debe requerir el permiso de auditoría de pagos o admin:all', () => {
      // Arrange & Act
      const requiredPermissions = new Reflector().get<string[]>(
        PERMISSIONS_KEY,
        // eslint-disable-next-line @typescript-eslint/unbound-method -- solo se lee su metadata, nunca se invoca desatado de la instancia
        controller.export,
      );

      // Assert
      expect(requiredPermissions).toEqual([
        PERMISSIONS.PAYMENTS.AUDIT_VIEW,
        PERMISSIONS.ADMIN.ALL,
      ]);
    });

    it('debe delegar el export al service con el query recibido', async () => {
      // Arrange
      const query: PaymentListQueryDTO = { status: PaymentStatus.COMPLETED };
      const expected: IDownloadResponse = {
        buffer: Buffer.from('csv'),
        filename: 'pagos-2026-09-07.csv',
        format: 'csv',
      };
      mockExportToCsv.mockResolvedValue(expected);

      // Act
      const result = await controller.export(query);

      // Assert
      expect(mockExportToCsv).toHaveBeenCalledWith(query);
      expect(result).toBe(expected);
    });
  });
});
