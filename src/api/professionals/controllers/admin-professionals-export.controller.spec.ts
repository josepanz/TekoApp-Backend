import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { PERMISSIONS_KEY } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { IDownloadResponse } from '@core/interceptors/file-download.interceptor';
import { AdminProfessionalsExportController } from './admin-professionals-export.controller';
import { ProfessionalsService } from '../services/professionals.service';
import { GetProfessionalsListQueryDTO } from '../dtos/request';

const mockExportToCsv = jest.fn();

describe('AdminProfessionalsExportController', () => {
  let controller: AdminProfessionalsExportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProfessionalsExportController],
      providers: [
        {
          provide: ProfessionalsService,
          useValue: { exportToCsv: mockExportToCsv },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AdminProfessionalsExportController>(
      AdminProfessionalsExportController,
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('export', () => {
    it('debe requerir el permiso de verificación de profesionales o admin:all', () => {
      // Arrange & Act
      const requiredPermissions = new Reflector().get<string[]>(
        PERMISSIONS_KEY,
        // eslint-disable-next-line @typescript-eslint/unbound-method -- solo se lee su metadata, nunca se invoca desatado de la instancia
        controller.export,
      );

      // Assert
      expect(requiredPermissions).toEqual([
        PERMISSIONS.PROFESSIONALS.VERIFY,
        PERMISSIONS.ADMIN.ALL,
      ]);
    });

    it('debe delegar el export al service con el query recibido', async () => {
      // Arrange
      const query: GetProfessionalsListQueryDTO = {
        categoryId: 2,
      } as GetProfessionalsListQueryDTO;
      const expected: IDownloadResponse = {
        buffer: Buffer.from('csv'),
        filename: 'profesionales-2026-09-07.csv',
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
