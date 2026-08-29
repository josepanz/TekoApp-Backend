import { Test, TestingModule } from '@nestjs/testing';
import { AiDisclosureEntityType, AiDisclosureSource } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { AiDisclosuresDbService } from './ai-disclosures-db.service';

const mockFindUnique = jest.fn();
const mockUpsert = jest.fn();
const mockDelete = jest.fn();

const mockPrisma = {
  extended: {
    aiContentDisclosures: {
      findUnique: mockFindUnique,
      upsert: mockUpsert,
      delete: mockDelete,
    },
  },
};

describe('AiDisclosuresDbService', () => {
  let service: AiDisclosuresDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiDisclosuresDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AiDisclosuresDbService>(AiDisclosuresDbService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findByEntity', () => {
    it('debe buscar por la clave compuesta (entityType, entityReferenceId)', async () => {
      // Arrange
      const disclosure = { referenceId: 'ai-1' };
      mockFindUnique.mockResolvedValue(disclosure);

      // Act
      const result = await service.findByEntity(
        AiDisclosureEntityType.SERVICE_DESCRIPTION,
        'svc-1',
      );

      // Assert
      expect(result).toEqual(disclosure);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          entityType_entityReferenceId: {
            entityType: AiDisclosureEntityType.SERVICE_DESCRIPTION,
            entityReferenceId: 'svc-1',
          },
        },
      });
    });
  });

  describe('upsertDisclosure', () => {
    it('debe crear o actualizar el disclosure vía upsert', async () => {
      // Arrange
      const created = { referenceId: 'ai-1' };
      mockUpsert.mockResolvedValue(created);

      // Act
      const result = await service.upsertDisclosure({
        entityType: AiDisclosureEntityType.SERVICE_DESCRIPTION,
        entityReferenceId: 'svc-1',
        source: AiDisclosureSource.USER_DECLARED_AI,
        declaredByUserId: 5,
      });

      // Assert
      expect(result).toEqual(created);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            entityType_entityReferenceId: {
              entityType: AiDisclosureEntityType.SERVICE_DESCRIPTION,
              entityReferenceId: 'svc-1',
            },
          },
        }),
      );
    });
  });

  describe('deleteByEntity', () => {
    it('debe eliminar por la clave compuesta (entityType, entityReferenceId)', async () => {
      // Arrange
      mockDelete.mockResolvedValue({});

      // Act
      await service.deleteByEntity(
        AiDisclosureEntityType.SERVICE_DESCRIPTION,
        'svc-1',
      );

      // Assert
      expect(mockDelete).toHaveBeenCalledWith({
        where: {
          entityType_entityReferenceId: {
            entityType: AiDisclosureEntityType.SERVICE_DESCRIPTION,
            entityReferenceId: 'svc-1',
          },
        },
      });
    });
  });
});
