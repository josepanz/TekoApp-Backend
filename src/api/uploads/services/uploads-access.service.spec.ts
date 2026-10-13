import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ServiceStatus } from '@prisma/client';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { StorageAccessDbService } from '@modules/storage-access-db/services/storage-access-db.service';
import { UploadsAccessService } from './uploads-access.service';

const mockFindOwnerByKey = jest.fn();
const mockIsOperatingProfessional = jest.fn();

const OWNER = { id: 1, permissions: [] as string[] };
const STRANGER = { id: 2, permissions: [] as string[] };
const ADMIN = { id: 3, permissions: [PERMISSIONS.ADMIN.ALL] };

describe('UploadsAccessService', () => {
  let service: UploadsAccessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsAccessService,
        {
          provide: StorageAccessDbService,
          useValue: {
            findOwnerByKey: mockFindOwnerByKey,
            isOperatingProfessional: mockIsOperatingProfessional,
          },
        },
      ],
    }).compile();
    service = module.get(UploadsAccessService);
  });

  afterEach(() => jest.resetAllMocks());

  it('debe responder NotFoundException para una key que ningún registro referencia, también al admin', async () => {
    // Arrange
    mockFindOwnerByKey.mockResolvedValue(null);

    // Act & Assert
    await expect(service.assertCanRead('x.pdf', ADMIN)).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.assertCanDelete('x.pdf', OWNER)).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('documentos profesionales', () => {
    const privateDoc = {
      kind: 'professional-document',
      ownerUserId: 1,
      isPublic: false,
    };

    it('debe permitir al dueño, al admin y a un revisor, y rechazar a un tercero', async () => {
      // Arrange
      mockFindOwnerByKey.mockResolvedValue(privateDoc);

      // Act & Assert
      await expect(service.assertCanRead('k', OWNER)).resolves.toBeUndefined();
      await expect(service.assertCanRead('k', ADMIN)).resolves.toBeUndefined();
      await expect(
        service.assertCanRead('k', {
          id: 9,
          permissions: [PERMISSIONS.PROFESSIONAL_DOCUMENTS.REVIEW],
        }),
      ).resolves.toBeUndefined();
      await expect(service.assertCanRead('k', STRANGER)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe permitir a cualquiera un documento aprobado y visible al cliente', async () => {
      // Arrange
      mockFindOwnerByKey.mockResolvedValue({ ...privateDoc, isPublic: true });

      // Act & Assert
      await expect(
        service.assertCanRead('k', STRANGER),
      ).resolves.toBeUndefined();
    });
  });

  describe('portafolio', () => {
    it('debe rechazar a un tercero si no es público y permitirle si lo es', async () => {
      // Arrange
      mockFindOwnerByKey.mockResolvedValueOnce({
        kind: 'portfolio-item',
        ownerUserId: 1,
        isPublic: false,
      });

      // Act & Assert
      await expect(service.assertCanRead('k', STRANGER)).rejects.toThrow(
        ForbiddenException,
      );
      mockFindOwnerByKey.mockResolvedValueOnce({
        kind: 'portfolio-item',
        ownerUserId: 1,
        isPublic: true,
      });
      await expect(
        service.assertCanRead('k', STRANGER),
      ).resolves.toBeUndefined();
    });
  });

  it('debe permitir el avatar a cualquier autenticado', async () => {
    // Arrange
    mockFindOwnerByKey.mockResolvedValue({ kind: 'avatar', ownerUserId: 1 });

    // Act & Assert
    await expect(service.assertCanRead('k', STRANGER)).resolves.toBeUndefined();
  });

  describe('contrato y bitácora', () => {
    it('debe permitir solo a las partes del contrato', async () => {
      // Arrange
      mockFindOwnerByKey.mockResolvedValue({
        kind: 'contract',
        clientUserId: 1,
        professionalUserId: 5,
      });

      // Act & Assert
      await expect(service.assertCanRead('k', OWNER)).resolves.toBeUndefined();
      await expect(
        service.assertCanRead('k', { id: 5, permissions: [] }),
      ).resolves.toBeUndefined();
      await expect(service.assertCanRead('k', STRANGER)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe permitir las fotos de bitácora al cliente, al asignado y a auditores, no a otros', async () => {
      // Arrange
      mockFindOwnerByKey.mockResolvedValue({
        kind: 'service-progress',
        clientUserId: 1,
        professionalUserId: 5,
        authorUserId: 5,
      });

      // Act & Assert
      await expect(service.assertCanRead('k', OWNER)).resolves.toBeUndefined();
      await expect(
        service.assertCanRead('k', { id: 5, permissions: [] }),
      ).resolves.toBeUndefined();
      await expect(
        service.assertCanRead('k', {
          id: 8,
          permissions: [PERMISSIONS.SERVICE_PROGRESS.AUDIT_VIEW],
        }),
      ).resolves.toBeUndefined();
      await expect(service.assertCanRead('k', STRANGER)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('fotos del servicio', () => {
    const pending = {
      kind: 'service-image',
      clientUserId: 1,
      professionalUserId: null,
      status: ServiceStatus.PENDING,
    };

    it('debe permitir a un profesional aprobado mientras el servicio está PENDING', async () => {
      // Arrange
      mockFindOwnerByKey.mockResolvedValue(pending);
      mockIsOperatingProfessional.mockResolvedValue(true);

      // Act & Assert
      await expect(
        service.assertCanRead('k', STRANGER),
      ).resolves.toBeUndefined();
    });

    it('debe rechazar al profesional ajeno cuando el servicio ya no está PENDING y a quien no es profesional', async () => {
      // Arrange
      mockFindOwnerByKey.mockResolvedValue({
        ...pending,
        professionalUserId: 5,
        status: ServiceStatus.ACCEPTED,
      });
      mockIsOperatingProfessional.mockResolvedValue(true);

      // Act & Assert
      await expect(service.assertCanRead('k', STRANGER)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockIsOperatingProfessional).not.toHaveBeenCalled();

      mockFindOwnerByKey.mockResolvedValue(pending);
      mockIsOperatingProfessional.mockResolvedValue(false);
      await expect(service.assertCanRead('k', STRANGER)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('borrado', () => {
    it('debe permitir al dueño y al admin, y rechazar a un tercero aunque el archivo sea público', async () => {
      // Arrange
      mockFindOwnerByKey.mockResolvedValue({
        kind: 'professional-document',
        ownerUserId: 1,
        isPublic: true,
      });

      // Act & Assert
      await expect(
        service.assertCanDelete('k', OWNER),
      ).resolves.toBeUndefined();
      await expect(
        service.assertCanDelete('k', ADMIN),
      ).resolves.toBeUndefined();
      await expect(service.assertCanDelete('k', STRANGER)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
