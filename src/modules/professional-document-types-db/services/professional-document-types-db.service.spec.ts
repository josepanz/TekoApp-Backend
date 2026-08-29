import { Test, TestingModule } from '@nestjs/testing';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { ProfessionalDocumentTypesDbService } from './professional-document-types-db.service';

const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();

const mockPrisma = {
  extended: {
    professionalDocumentTypes: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
    },
  },
};

describe('ProfessionalDocumentTypesDbService', () => {
  let service: ProfessionalDocumentTypesDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalDocumentTypesDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProfessionalDocumentTypesDbService>(
      ProfessionalDocumentTypesDbService,
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('findApplicableForCategory', () => {
    it('debe filtrar por categoría del profesional y catálogo global (countryId null)', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);

      // Act
      await service.findApplicableForCategory(3);

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            countryId: null,
            OR: [
              { professionalCategoryId: null },
              { professionalCategoryId: 3 },
            ],
          },
        }),
      );
    });
  });

  describe('findFiltered', () => {
    it('debe aplicar solo los filtros efectivamente pasados', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([]);

      // Act
      await service.findFiltered({ category: 'BACKGROUND_CHECK' });

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, category: 'BACKGROUND_CHECK' },
        }),
      );
    });
  });

  describe('create', () => {
    it('debe crear el tipo de documento con los datos recibidos', async () => {
      // Arrange
      const created = { id: 1, code: 'BG_CHECK' };
      mockCreate.mockResolvedValue(created);

      // Act
      const result = await service.create({
        code: 'BG_CHECK',
        name: 'Antecedentes',
        category: 'BACKGROUND_CHECK',
      });

      // Assert
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('debe actualizar por id', async () => {
      // Arrange
      mockUpdate.mockResolvedValue({ id: 1, isActive: false });

      // Act
      await service.update(1, { isActive: false });

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: false },
      });
    });
  });
});
