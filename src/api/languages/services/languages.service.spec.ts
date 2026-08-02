import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LanguagesDbService } from '@modules/languages-db/services/languages-db.service';
import { LanguagesService } from './languages.service';

const mockFindAllActive = jest.fn();
const mockFindById = jest.fn();

const spanish = { id: 1, code: 'es', name: 'Español', isActive: true };

describe('LanguagesService', () => {
  let service: LanguagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LanguagesService,
        {
          provide: LanguagesDbService,
          useValue: {
            findAllActive: mockFindAllActive,
            findById: mockFindById,
          },
        },
      ],
    }).compile();

    service = module.get<LanguagesService>(LanguagesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('debe retornar los idiomas activos', async () => {
      // Arrange
      mockFindAllActive.mockResolvedValue([spanish]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([spanish]);
    });
  });

  describe('findOne', () => {
    it('debe retornar el idioma cuando existe', async () => {
      // Arrange
      mockFindById.mockResolvedValue(spanish);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result).toEqual(spanish);
    });

    it('debe lanzar NotFoundException cuando el idioma no existe', async () => {
      // Arrange
      mockFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
