import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceStatus, UserProfileStatus, UserStatus } from '@prisma/client';
import { APP_CONFIG } from '@core/config/config-loader';
import { ServiceProgressDbService } from '@modules/service-progress-db/services/service-progress-db.service';
import { ServicesDbService } from '@modules/services-db/services/services-db.service';
import { LegalConsentsDbService } from '@modules/legal-consents-db/services/legal-consents-db.service';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { ServiceProgressService } from './service-progress.service';

const mockFindActiveByServiceId = jest.fn();
const mockCountActiveByServiceId = jest.fn();
const mockGetNextEntryOrder = jest.fn();
const mockCreateEntry = jest.fn();
const mockFindEntryByReferenceId = jest.fn();
const mockSoftDeleteEntry = jest.fn();
const mockFindServiceByReferenceId = jest.fn();
const mockFindProfessionalByUserId = jest.fn();
const mockHasActiveConsent = jest.fn();

const PROGRESS_LOG_CONFIG = {
  maxImagesPerEntry: 6,
  editWindowMinutes: 15,
  requireNoteOrImage: true,
};

describe('ServiceProgressService', () => {
  let service: ServiceProgressService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceProgressService,
        {
          provide: ServiceProgressDbService,
          useValue: {
            findActiveByServiceId: mockFindActiveByServiceId,
            countActiveByServiceId: mockCountActiveByServiceId,
            getNextEntryOrder: mockGetNextEntryOrder,
            createEntry: mockCreateEntry,
            findEntryByReferenceId: mockFindEntryByReferenceId,
            softDeleteEntry: mockSoftDeleteEntry,
          },
        },
        {
          provide: ServicesDbService,
          useValue: {
            findServiceByReferenceId: mockFindServiceByReferenceId,
            findProfessionalByUserId: mockFindProfessionalByUserId,
          },
        },
        {
          provide: LegalConsentsDbService,
          useValue: { hasActiveConsent: mockHasActiveConsent },
        },
        {
          provide: APP_CONFIG.KEY,
          useValue: { progressLog: PROGRESS_LOG_CONFIG },
        },
      ],
    }).compile();

    service = module.get<ServiceProgressService>(ServiceProgressService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createEntry', () => {
    const service_ = {
      id: 10,
      professionalId: 99,
      status: ServiceStatus.IN_PROGRESS,
    };
    const professional = { id: 99 };

    it('debe crear la entrada cuando el profesional asignado agrega nota sin fotos', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue(service_);
      mockFindProfessionalByUserId.mockResolvedValue(professional);
      mockGetNextEntryOrder.mockResolvedValue(1);
      mockCreateEntry.mockResolvedValue({
        referenceId: 'entry-1',
        note: 'Avance',
        images: [],
        entryOrder: 1,
        createdAt: new Date(),
      });

      // Act
      const result = await service.createEntry(
        'svc-ref-1',
        { note: 'Avance' },
        1,
        'user-ref-1',
      );

      // Assert
      expect(result.referenceId).toBe('entry-1');
      expect(mockHasActiveConsent).not.toHaveBeenCalled();
      expect(mockCreateEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceId: 10,
          professionalId: 99,
          note: 'Avance',
          images: [],
          entryOrder: 1,
        }),
      );
    });

    it('debe rechazar con 403 si quien llama no es el profesional asignado', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue(service_);
      mockFindProfessionalByUserId.mockResolvedValue({ id: 555 });

      // Act & Assert
      await expect(
        service.createEntry('svc-ref-1', { note: 'x' }, 1, 'user-ref-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe rechazar con 409 si el servicio no está ACCEPTED/IN_PROGRESS', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue({
        ...service_,
        status: ServiceStatus.COMPLETED,
      });
      mockFindProfessionalByUserId.mockResolvedValue(professional);

      // Act & Assert
      await expect(
        service.createEntry('svc-ref-1', { note: 'x' }, 1, 'user-ref-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('debe rechazar con 400 si no hay nota ni fotos y la config lo exige', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue(service_);
      mockFindProfessionalByUserId.mockResolvedValue(professional);

      // Act & Assert
      await expect(
        service.createEntry('svc-ref-1', {}, 1, 'user-ref-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con 400 si supera el máximo de fotos configurado', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue(service_);
      mockFindProfessionalByUserId.mockResolvedValue(professional);

      // Act & Assert
      await expect(
        service.createEntry(
          'svc-ref-1',
          { images: Array<string>(7).fill('key.jpg') },
          1,
          'user-ref-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con 403 CONSENT_REQUIRED si hay fotos y falta consentimiento de imagen', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue(service_);
      mockFindProfessionalByUserId.mockResolvedValue(professional);
      mockHasActiveConsent.mockResolvedValue(false);

      // Act & Assert
      await expect(
        service.createEntry(
          'svc-ref-1',
          { images: ['key.jpg'] },
          1,
          'user-ref-1',
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(mockCreateEntry).not.toHaveBeenCalled();
    });

    it('no debe pedir consentimiento cuando la entrada no incluye fotos', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue(service_);
      mockFindProfessionalByUserId.mockResolvedValue(professional);
      mockGetNextEntryOrder.mockResolvedValue(1);
      mockCreateEntry.mockResolvedValue({
        referenceId: 'entry-1',
        note: 'Avance',
        images: [],
        entryOrder: 1,
        createdAt: new Date(),
      });

      // Act
      await service.createEntry(
        'svc-ref-1',
        { note: 'Avance' },
        1,
        'user-ref-1',
      );

      // Assert
      expect(mockHasActiveConsent).not.toHaveBeenCalled();
    });
  });

  describe('listByService', () => {
    const baseUser: IUserDataOnJwt = {
      id: 1,
      referenceId: 'user-ref-1',
      email: 'a@a.com',
      firstName: 'A',
      lastName: 'B',
      accessLevelId: 1,
      userStatus: UserStatus.ACTIVE,
      profileStatus: UserProfileStatus.COMPLETE,
      permissions: [],
      roles: [],
    };

    it('debe permitir ver la bitácora al cliente dueño del servicio', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue({
        id: 10,
        userId: 1,
        professionalId: 99,
      });
      mockFindProfessionalByUserId.mockResolvedValue(null);
      mockFindActiveByServiceId.mockResolvedValue([]);

      // Act
      const result = await service.listByService('svc-ref-1', baseUser);

      // Assert
      expect(result.data).toEqual([]);
    });

    it('debe permitir ver la bitácora a staff con permiso de auditoría aunque no sea participante', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue({
        id: 10,
        userId: 55,
        professionalId: 77,
      });
      mockFindProfessionalByUserId.mockResolvedValue(null);
      mockFindActiveByServiceId.mockResolvedValue([]);

      // Act
      const result = await service.listByService('svc-ref-1', {
        ...baseUser,
        permissions: [PERMISSIONS.SERVICE_PROGRESS.AUDIT_VIEW],
      });

      // Assert
      expect(result.data).toEqual([]);
    });

    it('debe rechazar con 403 a un usuario que no es participante ni staff', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue({
        id: 10,
        userId: 55,
        professionalId: 77,
      });
      mockFindProfessionalByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.listByService('svc-ref-1', baseUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteEntry', () => {
    it('debe eliminar (soft-delete) dentro de la ventana de corrección', async () => {
      // Arrange
      mockFindEntryByReferenceId.mockResolvedValue({
        id: 3,
        isActive: true,
        professionalId: 99,
        createdAt: new Date(),
      });
      mockFindProfessionalByUserId.mockResolvedValue({ id: 99 });

      // Act
      await service.deleteEntry('entry-ref-1', 1, 'user-ref-1');

      // Assert
      expect(mockSoftDeleteEntry).toHaveBeenCalledWith(3, 'user-ref-1');
    });

    it('debe rechazar con 404 si la entrada no existe o ya fue eliminada', async () => {
      // Arrange
      mockFindEntryByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.deleteEntry('entry-ref-1', 1, 'user-ref-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar con 403 si quien llama no es el autor de la entrada', async () => {
      // Arrange
      mockFindEntryByReferenceId.mockResolvedValue({
        id: 3,
        isActive: true,
        professionalId: 99,
        createdAt: new Date(),
      });
      mockFindProfessionalByUserId.mockResolvedValue({ id: 555 });

      // Act & Assert
      await expect(
        service.deleteEntry('entry-ref-1', 1, 'user-ref-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe rechazar con 409 si ya venció la ventana de corrección', async () => {
      // Arrange
      const oldDate = new Date(Date.now() - 60 * 60_000); // 1h atrás, ventana es 15min
      mockFindEntryByReferenceId.mockResolvedValue({
        id: 3,
        isActive: true,
        professionalId: 99,
        createdAt: oldDate,
      });
      mockFindProfessionalByUserId.mockResolvedValue({ id: 99 });

      // Act & Assert
      await expect(
        service.deleteEntry('entry-ref-1', 1, 'user-ref-1'),
      ).rejects.toThrow(ConflictException);
    });
  });
});
