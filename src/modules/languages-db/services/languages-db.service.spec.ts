import { Test, TestingModule } from '@nestjs/testing';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { LanguagesDbService } from './languages-db.service';

const mockLanguageFindMany = jest.fn();
const mockLanguageFindUnique = jest.fn();

const mockPrisma = {
  extended: {
    language: {
      findMany: mockLanguageFindMany,
      findUnique: mockLanguageFindUnique,
    },
  },
};

const spanish = { id: 1, code: 'es', name: 'Español', isActive: true };

describe('LanguagesDbService', () => {
  let service: LanguagesDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LanguagesDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LanguagesDbService>(LanguagesDbService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAllActive', () => {
    it('debe retornar solo los idiomas activos ordenados por código', async () => {
      // Arrange
      mockLanguageFindMany.mockResolvedValue([spanish]);

      // Act
      const result = await service.findAllActive();

      // Assert
      expect(result).toEqual([spanish]);
      expect(mockLanguageFindMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { code: 'asc' },
      });
    });
  });

  describe('findById', () => {
    it('debe retornar el idioma cuando existe', async () => {
      // Arrange
      mockLanguageFindUnique.mockResolvedValue(spanish);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(result).toEqual(spanish);
      expect(mockLanguageFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('debe retornar null cuando el idioma no existe', async () => {
      // Arrange
      mockLanguageFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });
});
