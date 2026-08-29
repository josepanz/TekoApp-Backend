import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AiDisclosureEntityType, AiDisclosureSource } from '@prisma/client';
import { APP_CONFIG } from '@core/config/config-loader';
import { AiDisclosuresService } from './ai-disclosures.service';
import { AiDisclosuresDbService } from '@modules/ai-disclosures-db/services/ai-disclosures-db.service';
import { ServicesDbService } from '@modules/services-db/services/services-db.service';
import { ProfessionalsDbService } from '@modules/professionals-db/services/professionals-db.service';

const mockFindByEntity = jest.fn();
const mockUpsertDisclosure = jest.fn();
const mockDeleteByEntity = jest.fn();
const mockFindPaginated = jest.fn();
const mockFindServiceByReferenceId = jest.fn();
const mockFindProfessionalByReferenceId = jest.fn();

describe('AiDisclosuresService', () => {
  let service: AiDisclosuresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiDisclosuresService,
        {
          provide: AiDisclosuresDbService,
          useValue: {
            findByEntity: mockFindByEntity,
            upsertDisclosure: mockUpsertDisclosure,
            deleteByEntity: mockDeleteByEntity,
            findPaginated: mockFindPaginated,
          },
        },
        {
          provide: ServicesDbService,
          useValue: { findServiceByReferenceId: mockFindServiceByReferenceId },
        },
        {
          provide: ProfessionalsDbService,
          useValue: { findByReferenceId: mockFindProfessionalByReferenceId },
        },
        {
          provide: APP_CONFIG.KEY,
          useValue: {
            aiDisclosure: {
              userDeclarableTypes: [
                AiDisclosureEntityType.SERVICE_DESCRIPTION,
                AiDisclosureEntityType.PROFESSIONAL_DESCRIPTION,
              ],
            },
          },
        },
      ],
    }).compile();

    service = module.get<AiDisclosuresService>(AiDisclosuresService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('declare', () => {
    it('debe crear el disclosure cuando el usuario es dueño del contenido', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue({ userId: 5 });
      const created = { referenceId: 'ai-1' };
      mockUpsertDisclosure.mockResolvedValue(created);

      // Act
      const result = await service.declare(
        5,
        {
          entityType: AiDisclosureEntityType.SERVICE_DESCRIPTION,
          entityReferenceId: 'svc-1',
        },
        'user@test.com',
      );

      // Assert
      expect(result).toEqual(created);
      expect(mockUpsertDisclosure).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: AiDisclosureEntityType.SERVICE_DESCRIPTION,
          entityReferenceId: 'svc-1',
          source: AiDisclosureSource.USER_DECLARED_AI,
          declaredByUserId: 5,
        }),
      );
    });

    it('debe lanzar BadRequestException si el tipo no admite autodeclaración', async () => {
      // Act & Assert
      await expect(
        service.declare(
          5,
          {
            entityType: AiDisclosureEntityType.BUDGET_OPTION,
            entityReferenceId: 'budget-1',
          },
          'user@test.com',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(mockFindServiceByReferenceId).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si la entidad no existe', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.declare(
          5,
          {
            entityType: AiDisclosureEntityType.SERVICE_DESCRIPTION,
            entityReferenceId: 'svc-inexistente',
          },
          'user@test.com',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ForbiddenException si el usuario no es dueño del contenido', async () => {
      // Arrange
      mockFindServiceByReferenceId.mockResolvedValue({ userId: 999 });

      // Act & Assert
      await expect(
        service.declare(
          5,
          {
            entityType: AiDisclosureEntityType.SERVICE_DESCRIPTION,
            entityReferenceId: 'svc-de-otro',
          },
          'user@test.com',
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(mockUpsertDisclosure).not.toHaveBeenCalled();
    });

    it('debe resolver el dueño contra Professionals para PROFESSIONAL_DESCRIPTION', async () => {
      // Arrange
      mockFindProfessionalByReferenceId.mockResolvedValue({ userId: 5 });
      mockUpsertDisclosure.mockResolvedValue({ referenceId: 'ai-2' });

      // Act
      await service.declare(
        5,
        {
          entityType: AiDisclosureEntityType.PROFESSIONAL_DESCRIPTION,
          entityReferenceId: 'prof-1',
        },
        'user@test.com',
      );

      // Assert
      expect(mockFindProfessionalByReferenceId).toHaveBeenCalledWith('prof-1');
    });
  });

  describe('retract', () => {
    it('debe eliminar la declaración cuando el usuario es quien la declaró', async () => {
      // Arrange
      mockFindByEntity.mockResolvedValue({ declaredByUserId: 5 });
      mockDeleteByEntity.mockResolvedValue({});

      // Act
      await service.retract(5, {
        entityType: AiDisclosureEntityType.SERVICE_DESCRIPTION,
        entityReferenceId: 'svc-1',
      });

      // Assert
      expect(mockDeleteByEntity).toHaveBeenCalledWith(
        AiDisclosureEntityType.SERVICE_DESCRIPTION,
        'svc-1',
      );
    });

    it('debe lanzar NotFoundException si no hay declaración vigente', async () => {
      // Arrange
      mockFindByEntity.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.retract(5, {
          entityType: AiDisclosureEntityType.SERVICE_DESCRIPTION,
          entityReferenceId: 'svc-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ForbiddenException si la declaración es de otro usuario', async () => {
      // Arrange
      mockFindByEntity.mockResolvedValue({ declaredByUserId: 999 });

      // Act & Assert
      await expect(
        service.retract(5, {
          entityType: AiDisclosureEntityType.SERVICE_DESCRIPTION,
          entityReferenceId: 'svc-1',
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(mockDeleteByEntity).not.toHaveBeenCalled();
    });
  });

  describe('findByEntity', () => {
    it('debe retornar el disclosure existente', async () => {
      // Arrange
      const disclosure = { referenceId: 'ai-1' };
      mockFindByEntity.mockResolvedValue(disclosure);

      // Act
      const result = await service.findByEntity({
        entityType: AiDisclosureEntityType.SERVICE_DESCRIPTION,
        entityReferenceId: 'svc-1',
      });

      // Assert
      expect(result).toEqual(disclosure);
    });

    it('debe retornar null si no hay disclosure', async () => {
      // Arrange
      mockFindByEntity.mockResolvedValue(null);

      // Act
      const result = await service.findByEntity({
        entityType: AiDisclosureEntityType.SERVICE_DESCRIPTION,
        entityReferenceId: 'svc-1',
      });

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findPaginatedForAdmin', () => {
    it('debe delegar la paginación al db service', async () => {
      // Arrange
      const paginated = { data: [], pagination: { total: 0 } };
      mockFindPaginated.mockResolvedValue(paginated);

      // Act
      const result = await service.findPaginatedForAdmin({});

      // Assert
      expect(result).toEqual(paginated);
    });
  });
});
