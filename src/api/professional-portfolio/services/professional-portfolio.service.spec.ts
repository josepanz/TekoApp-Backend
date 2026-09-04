import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioReviewStatus } from '@prisma/client';
import { ProfessionalPortfolioDbService } from '@modules/professional-portfolio-db/services/professional-portfolio-db.service';
import { ProfessionalsDbService } from '@modules/professionals-db/services/professionals-db.service';
import { StorageService } from '@modules/storage/services/storage.service';
import { ProfessionalPortfolioService } from './professional-portfolio.service';

const mockCreate = jest.fn();
const mockFindAllByProfessionalId = jest.fn();
const mockFindPublicByProfessionalId = jest.fn();
const mockFindByReferenceId = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockUpdateStatusConditional = jest.fn();
const mockFindPaginatedForAdmin = jest.fn();

const mockFindByUserId = jest.fn();
const mockFindProfessionalByReferenceId = jest.fn();

const mockUploadFilesQueue = jest.fn();

const professional = { id: 100, userId: 5 };

function portfolioItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    referenceId: 'item-1',
    professionalId: 100,
    fileKey: 'abc.jpg',
    caption: null,
    sortOrder: 0,
    isVisible: true,
    status: PortfolioReviewStatus.PENDING,
    reviewedAt: null,
    rejectionReason: null,
    createdAt: new Date('2026-08-20'),
    ...overrides,
  };
}

function multerFile(overrides: Partial<Express.Multer.File> = {}) {
  return {
    originalname: 'foto.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('x'),
    ...overrides,
  } as Express.Multer.File;
}

describe('ProfessionalPortfolioService', () => {
  let service: ProfessionalPortfolioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalPortfolioService,
        {
          provide: ProfessionalPortfolioDbService,
          useValue: {
            create: mockCreate,
            findAllByProfessionalId: mockFindAllByProfessionalId,
            findPublicByProfessionalId: mockFindPublicByProfessionalId,
            findByReferenceId: mockFindByReferenceId,
            update: mockUpdate,
            delete: mockDelete,
            updateStatusConditional: mockUpdateStatusConditional,
            findPaginatedForAdmin: mockFindPaginatedForAdmin,
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
          provide: StorageService,
          useValue: { uploadFilesQueue: mockUploadFilesQueue },
        },
      ],
    }).compile();

    service = module.get<ProfessionalPortfolioService>(
      ProfessionalPortfolioService,
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('uploadItem', () => {
    it('debe rechazar con 400 si no llega archivo', async () => {
      // Act & Assert
      await expect(
        service.uploadItem(
          5,
          {},
          undefined as unknown as Express.Multer.File,
          'user-ref',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con 400 si el archivo supera el tamaño máximo', async () => {
      // Act & Assert
      await expect(
        service.uploadItem(
          5,
          {},
          multerFile({ size: 6 * 1024 * 1024 }),
          'user-ref',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con 400 si el tipo MIME no es una imagen permitida', async () => {
      // Act & Assert
      await expect(
        service.uploadItem(
          5,
          {},
          multerFile({ mimetype: 'application/pdf' }),
          'user-ref',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe crear la foto en PENDING para el profesional del usuario autenticado', async () => {
      // Arrange
      mockFindByUserId.mockResolvedValue(professional);
      mockUploadFilesQueue.mockResolvedValue([{ key: 'abc.jpg' }]);
      mockCreate.mockResolvedValue(portfolioItem());

      // Act
      await service.uploadItem(
        5,
        { caption: 'Instalación terminada' },
        multerFile(),
        'user-ref',
      );

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          professionalId: professional.id,
          status: PortfolioReviewStatus.PENDING,
          caption: 'Instalación terminada',
        }),
      );
    });
  });

  describe('publicPortfolio', () => {
    it('debe resolver el profesional por referenceId y devolver sus fotos públicas', async () => {
      // Arrange
      mockFindProfessionalByReferenceId.mockResolvedValue(professional);
      mockFindPublicByProfessionalId.mockResolvedValue([]);

      // Act
      await service.publicPortfolio('prof-ref-1');

      // Assert
      expect(mockFindProfessionalByReferenceId).toHaveBeenCalledWith(
        'prof-ref-1',
      );
      expect(mockFindPublicByProfessionalId).toHaveBeenCalledWith(
        professional.id,
      );
    });
  });

  describe('updateItem', () => {
    it('debe rechazar con 404 si la foto no existe', async () => {
      // Arrange
      mockFindByUserId.mockResolvedValue(professional);
      mockFindByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateItem(5, 'item-1', {}, 'user-ref'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar con 403 si la foto pertenece a otro profesional', async () => {
      // Arrange
      mockFindByUserId.mockResolvedValue(professional);
      mockFindByReferenceId.mockResolvedValue(
        portfolioItem({ professionalId: 999 }),
      );

      // Act & Assert
      await expect(
        service.updateItem(5, 'item-1', { caption: 'nuevo' }, 'user-ref'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('debe actualizar caption/orden/visibilidad si el dueño coincide', async () => {
      // Arrange
      mockFindByUserId.mockResolvedValue(professional);
      mockFindByReferenceId.mockResolvedValue(portfolioItem());
      mockUpdate.mockResolvedValue(portfolioItem({ isVisible: false }));

      // Act
      await service.updateItem(5, 'item-1', { isVisible: false }, 'user-ref');

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ isVisible: false }),
      );
    });
  });

  describe('deleteItem', () => {
    it('debe rechazar con 403 si la foto pertenece a otro profesional', async () => {
      // Arrange
      mockFindByUserId.mockResolvedValue(professional);
      mockFindByReferenceId.mockResolvedValue(
        portfolioItem({ professionalId: 999 }),
      );

      // Act & Assert
      await expect(service.deleteItem(5, 'item-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('debe borrar la foto si el dueño coincide', async () => {
      // Arrange
      mockFindByUserId.mockResolvedValue(professional);
      mockFindByReferenceId.mockResolvedValue(portfolioItem());

      // Act
      await service.deleteItem(5, 'item-1');

      // Assert
      expect(mockDelete).toHaveBeenCalledWith(1);
    });
  });

  describe('review', () => {
    it('debe rechazar con 404 si la foto no existe', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.review(
          'item-1',
          PortfolioReviewStatus.APPROVED,
          undefined,
          'staff-ref',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar con 409 si la foto ya no está PENDING', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue(portfolioItem());
      mockUpdateStatusConditional.mockResolvedValue(0);

      // Act & Assert
      await expect(
        service.review(
          'item-1',
          PortfolioReviewStatus.APPROVED,
          undefined,
          'staff-ref',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('debe aprobar la foto', async () => {
      // Arrange
      mockFindByReferenceId
        .mockResolvedValueOnce(portfolioItem())
        .mockResolvedValueOnce(
          portfolioItem({ status: PortfolioReviewStatus.APPROVED }),
        );
      mockUpdateStatusConditional.mockResolvedValue(1);

      // Act
      await service.review(
        'item-1',
        PortfolioReviewStatus.APPROVED,
        undefined,
        'staff-ref',
      );

      // Assert
      expect(mockUpdateStatusConditional).toHaveBeenCalledWith(
        1,
        [PortfolioReviewStatus.PENDING],
        expect.objectContaining({
          status: PortfolioReviewStatus.APPROVED,
          reviewedBy: 'staff-ref',
          rejectionReason: null,
        }),
      );
    });

    it('debe rechazar con el motivo cuando status=REJECTED', async () => {
      // Arrange
      mockFindByReferenceId
        .mockResolvedValueOnce(portfolioItem())
        .mockResolvedValueOnce(
          portfolioItem({ status: PortfolioReviewStatus.REJECTED }),
        );
      mockUpdateStatusConditional.mockResolvedValue(1);

      // Act
      await service.review(
        'item-1',
        PortfolioReviewStatus.REJECTED,
        'Foto borrosa',
        'staff-ref',
      );

      // Assert
      expect(mockUpdateStatusConditional).toHaveBeenCalledWith(
        1,
        [PortfolioReviewStatus.PENDING],
        expect.objectContaining({
          status: PortfolioReviewStatus.REJECTED,
          rejectionReason: 'Foto borrosa',
        }),
      );
    });
  });

  describe('adminQueue', () => {
    it('debe mapear el contexto del profesional en cada fila de la cola', async () => {
      // Arrange
      mockFindPaginatedForAdmin.mockResolvedValue({
        data: [
          portfolioItem({
            professional: {
              referenceId: 'prof-ref-1',
              user: { firstName: 'Ana', lastName: 'Gómez' },
            },
          }),
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
    });
  });
});
