import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LanguagesController } from './languages.controller';
import { LanguagesService } from '@api/languages/services/languages.service';

const mockFindAll = jest.fn();
const mockFindOne = jest.fn();

describe('LanguagesController', () => {
  let controller: LanguagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LanguagesController],
      providers: [
        {
          provide: LanguagesService,
          useValue: { findAll: mockFindAll, findOne: mockFindOne },
        },
      ],
    }).compile();

    controller = module.get<LanguagesController>(LanguagesController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('debe retornar la lista de idiomas', async () => {
      // Arrange
      const languages = [{ id: 1, code: 'es', name: 'Español' }];
      mockFindAll.mockResolvedValue(languages);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toEqual(languages);
      expect(mockFindAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debe retornar el idioma solicitado', async () => {
      // Arrange
      const language = { id: 1, code: 'es', name: 'Español' };
      mockFindOne.mockResolvedValue(language);

      // Act
      const result = await controller.findOne({ id: 1 });

      // Assert
      expect(result).toEqual(language);
      expect(mockFindOne).toHaveBeenCalledWith(1);
    });

    it('debe propagar NotFoundException cuando el idioma no existe', async () => {
      // Arrange
      mockFindOne.mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(controller.findOne({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
