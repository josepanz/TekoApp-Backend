import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentReviewStatus } from '@prisma/client';
import { ProfessionalDocumentsDbService } from '@modules/professional-documents-db/services/professional-documents-db.service';
import { ProfessionalVerificationHelper } from '@modules/professional-documents-db/helpers/professional-verification.helper';
import { ProfessionalDocumentTypesDbService } from '@modules/professional-document-types-db/services/professional-document-types-db.service';
import { ProfessionalsDbService } from '@modules/professionals-db/services/professionals-db.service';
import { StorageService } from '@modules/storage/services/storage.service';
import { ProfessionalDocumentsService } from './professional-documents.service';

const mockCreate = jest.fn();
const mockFindAllByProfessionalId = jest.fn();
const mockFindPublicByProfessionalId = jest.fn();
const mockFindByReferenceId = jest.fn();
const mockUpdateStatusConditional = jest.fn();
const mockFindPaginatedForAdmin = jest.fn();

const mockFindApplicableForCategory = jest.fn();
const mockFindDocTypeByReferenceId = jest.fn();

const mockFindByUserId = jest.fn();
const mockFindProfessionalByReferenceId = jest.fn();

const mockRecompute = jest.fn();
const mockUploadFilesQueue = jest.fn();

const professional = { id: 100, userId: 5, categoryId: 3 };

function documentType(overrides: Record<string, unknown> = {}) {
  return {
    id: 20,
    referenceId: 'type-ref-1',
    code: 'BG_CHECK',
    countryId: null,
    professionalCategoryId: null,
    validityDays: null,
    requiresStaffReview: true,
    ...overrides,
  };
}

function multerFile(overrides: Partial<Express.Multer.File> = {}) {
  return {
    originalname: 'doc.pdf',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('x'),
    ...overrides,
  } as Express.Multer.File;
}

describe('ProfessionalDocumentsService', () => {
  let service: ProfessionalDocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalDocumentsService,
        {
          provide: ProfessionalDocumentsDbService,
          useValue: {
            create: mockCreate,
            findAllByProfessionalId: mockFindAllByProfessionalId,
            findPublicByProfessionalId: mockFindPublicByProfessionalId,
            findByReferenceId: mockFindByReferenceId,
            updateStatusConditional: mockUpdateStatusConditional,
            findPaginatedForAdmin: mockFindPaginatedForAdmin,
          },
        },
        {
          provide: ProfessionalDocumentTypesDbService,
          useValue: {
            findApplicableForCategory: mockFindApplicableForCategory,
            findByReferenceId: mockFindDocTypeByReferenceId,
          },
        },
        {
          provide: ProfessionalsDbService,
          useValue: {
            findByUserId: mockFindByUserId,
            findProfessionalByReferenceId: mockFindProfessionalByReferenceId,
          },
        },
        {
          provide: ProfessionalVerificationHelper,
          useValue: { recompute: mockRecompute },
        },
        {
          provide: StorageService,
          useValue: { uploadFilesQueue: mockUploadFilesQueue },
        },
      ],
    }).compile();

    service = module.get<ProfessionalDocumentsService>(
      ProfessionalDocumentsService,
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('uploadDocument', () => {
    it('debe rechazar con 400 si no llega archivo', async () => {
      // Act & Assert
      await expect(
        service.uploadDocument(
          5,
          { professionalDocumentTypeReferenceId: 'type-ref-1' },
          undefined as unknown as Express.Multer.File,
          'user-ref',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con 400 si el archivo supera el tamaño máximo', async () => {
      // Act & Assert
      await expect(
        service.uploadDocument(
          5,
          { professionalDocumentTypeReferenceId: 'type-ref-1' },
          multerFile({ size: 6 * 1024 * 1024 }),
          'user-ref',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con 400 si el tipo MIME no está permitido', async () => {
      // Act & Assert
      await expect(
        service.uploadDocument(
          5,
          { professionalDocumentTypeReferenceId: 'type-ref-1' },
          multerFile({ mimetype: 'application/zip' }),
          'user-ref',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con 404 si el tipo de documento no existe', async () => {
      // Arrange
      mockFindByUserId.mockResolvedValue(professional);
      mockFindDocTypeByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.uploadDocument(
          5,
          { professionalDocumentTypeReferenceId: 'type-ref-1' },
          multerFile(),
          'user-ref',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar con 404 si el tipo no aplica a la categoría del profesional', async () => {
      // Arrange
      mockFindByUserId.mockResolvedValue(professional);
      mockFindDocTypeByReferenceId.mockResolvedValue(
        documentType({ professionalCategoryId: 99 }),
      );

      // Act & Assert
      await expect(
        service.uploadDocument(
          5,
          { professionalDocumentTypeReferenceId: 'type-ref-1' },
          multerFile(),
          'user-ref',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe crear el documento en PENDING cuando el tipo exige revisión de staff', async () => {
      // Arrange
      mockFindByUserId.mockResolvedValue(professional);
      mockFindDocTypeByReferenceId.mockResolvedValue(
        documentType({ requiresStaffReview: true }),
      );
      mockUploadFilesQueue.mockResolvedValue([{ key: 'abc.pdf' }]);
      mockCreate.mockResolvedValue({
        referenceId: 'doc-1',
        professionalDocumentType: documentType(),
        fileKey: 'abc.pdf',
        status: DocumentReviewStatus.PENDING,
      });

      // Act
      await service.uploadDocument(
        5,
        { professionalDocumentTypeReferenceId: 'type-ref-1' },
        multerFile(),
        'user-ref',
      );

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ status: DocumentReviewStatus.PENDING }),
      );
      expect(mockRecompute).not.toHaveBeenCalled();
    });

    it('debe auto-aprobar y recomputar verificación cuando el tipo no exige revisión de staff', async () => {
      // Arrange
      mockFindByUserId.mockResolvedValue(professional);
      mockFindDocTypeByReferenceId.mockResolvedValue(
        documentType({ requiresStaffReview: false, validityDays: 30 }),
      );
      mockUploadFilesQueue.mockResolvedValue([{ key: 'abc.pdf' }]);
      mockCreate.mockResolvedValue({
        referenceId: 'doc-1',
        professionalDocumentType: documentType(),
        fileKey: 'abc.pdf',
        status: DocumentReviewStatus.APPROVED,
      });

      // Act
      await service.uploadDocument(
        5,
        { professionalDocumentTypeReferenceId: 'type-ref-1' },
        multerFile(),
        'user-ref',
      );

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: DocumentReviewStatus.APPROVED,
          expiresAt: expect.any(Date) as Date,
        }),
      );
      expect(mockRecompute).toHaveBeenCalledWith(professional.id);
    });
  });

  describe('myDocuments', () => {
    it('debe mostrar el documento más reciente por tipo y null si nunca cargó nada', async () => {
      // Arrange
      mockFindByUserId.mockResolvedValue(professional);
      mockFindApplicableForCategory.mockResolvedValue([
        documentType({ id: 20 }),
        documentType({ id: 21, code: 'PORTFOLIO' }),
      ]);
      mockFindAllByProfessionalId.mockResolvedValue([
        {
          referenceId: 'doc-recent',
          professionalDocumentTypeId: 20,
          professionalDocumentType: documentType({ id: 20 }),
          createdAt: new Date('2026-08-20'),
        },
        {
          referenceId: 'doc-old',
          professionalDocumentTypeId: 20,
          professionalDocumentType: documentType({ id: 20 }),
          createdAt: new Date('2026-08-01'),
        },
      ]);

      // Act
      const result = await service.myDocuments(5);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data[0].document?.referenceId).toBe('doc-recent');
      expect(result.data[1].document).toBeNull();
    });
  });

  describe('publicDocuments', () => {
    it('debe resolver el profesional por referenceId y devolver sus documentos públicos', async () => {
      // Arrange
      mockFindProfessionalByReferenceId.mockResolvedValue(professional);
      mockFindPublicByProfessionalId.mockResolvedValue([]);

      // Act
      await service.publicDocuments('prof-ref-1');

      // Assert
      expect(mockFindProfessionalByReferenceId).toHaveBeenCalledWith(
        'prof-ref-1',
      );
      expect(mockFindPublicByProfessionalId).toHaveBeenCalledWith(
        professional.id,
      );
    });
  });

  describe('adminQueue', () => {
    it('debe mapear el contexto del profesional en cada fila de la cola', async () => {
      // Arrange
      mockFindPaginatedForAdmin.mockResolvedValue({
        data: [
          {
            referenceId: 'doc-1',
            professionalDocumentType: documentType(),
            fileKey: 'abc.pdf',
            status: DocumentReviewStatus.PENDING,
            professional: {
              referenceId: 'prof-ref-1',
              user: { firstName: 'Ana', lastName: 'Gómez' },
            },
          },
        ],
        pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
      });

      // Act
      const result = await service.adminQueue({
        page: 1,
        pageSize: 10,
      } as never);

      // Assert
      expect(result.data[0].professional).toEqual({
        referenceId: 'prof-ref-1',
        firstName: 'Ana',
        lastName: 'Gómez',
      });
      expect(mockFindPaginatedForAdmin).toHaveBeenCalledWith(
        { status: undefined, category: undefined },
        expect.anything(),
      );
    });
  });

  describe('review', () => {
    it('debe rechazar con 404 si el documento no existe', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.review(
          'doc-1',
          DocumentReviewStatus.APPROVED,
          undefined,
          'staff-ref',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar con 409 si el documento ya no está PENDING', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue({
        id: 1,
        professionalId: 100,
        issuedAt: null,
        expiresAt: null,
        professionalDocumentType: documentType(),
      });
      mockUpdateStatusConditional.mockResolvedValue(0);

      // Act & Assert
      await expect(
        service.review(
          'doc-1',
          DocumentReviewStatus.APPROVED,
          undefined,
          'staff-ref',
        ),
      ).rejects.toThrow(ConflictException);
      expect(mockRecompute).not.toHaveBeenCalled();
    });

    it('debe aprobar, calcular expiresAt según validityDays, y recomputar verificación', async () => {
      // Arrange
      mockFindByReferenceId
        .mockResolvedValueOnce({
          id: 1,
          professionalId: 100,
          issuedAt: new Date('2026-01-01'),
          expiresAt: null,
          professionalDocumentType: documentType({ validityDays: 10 }),
        })
        .mockResolvedValueOnce({
          referenceId: 'doc-1',
          professionalDocumentType: documentType(),
          status: DocumentReviewStatus.APPROVED,
        });
      mockUpdateStatusConditional.mockResolvedValue(1);

      // Act
      await service.review(
        'doc-1',
        DocumentReviewStatus.APPROVED,
        undefined,
        'staff-ref',
      );

      // Assert
      expect(mockUpdateStatusConditional).toHaveBeenCalledWith(
        1,
        [DocumentReviewStatus.PENDING],
        expect.objectContaining({
          status: DocumentReviewStatus.APPROVED,
          reviewedBy: 'staff-ref',
          expiresAt: new Date(
            new Date('2026-01-01').getTime() + 10 * 24 * 60 * 60 * 1000,
          ),
        }),
      );
      expect(mockRecompute).toHaveBeenCalledWith(100);
    });

    it('debe rechazar con el motivo cuando status=REJECTED', async () => {
      // Arrange
      mockFindByReferenceId
        .mockResolvedValueOnce({
          id: 1,
          professionalId: 100,
          issuedAt: null,
          expiresAt: null,
          professionalDocumentType: documentType(),
        })
        .mockResolvedValueOnce({
          referenceId: 'doc-1',
          professionalDocumentType: documentType(),
          status: DocumentReviewStatus.REJECTED,
        });
      mockUpdateStatusConditional.mockResolvedValue(1);

      // Act
      await service.review(
        'doc-1',
        DocumentReviewStatus.REJECTED,
        'Foto ilegible',
        'staff-ref',
      );

      // Assert
      expect(mockUpdateStatusConditional).toHaveBeenCalledWith(
        1,
        [DocumentReviewStatus.PENDING],
        expect.objectContaining({
          status: DocumentReviewStatus.REJECTED,
          rejectionReason: 'Foto ilegible',
        }),
      );
    });
  });
});
