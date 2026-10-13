import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { ProfessionalDocumentTypesDbService } from '@modules/professional-document-types-db/services/professional-document-types-db.service';
import { ProfessionalDocumentTypesService } from './professional-document-types.service';

const mockFindFiltered = jest.fn();
const mockFindByReferenceId = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();

describe('ProfessionalDocumentTypesService', () => {
  let service: ProfessionalDocumentTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalDocumentTypesService,
        {
          provide: ProfessionalDocumentTypesDbService,
          useValue: {
            findFiltered: mockFindFiltered,
            findByReferenceId: mockFindByReferenceId,
            create: mockCreate,
            update: mockUpdate,
          },
        },
      ],
    }).compile();

    service = module.get<ProfessionalDocumentTypesService>(
      ProfessionalDocumentTypesService,
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('debe envolver el resultado en { data }', async () => {
      // Arrange
      mockFindFiltered.mockResolvedValue([{ code: 'BG_CHECK' }]);

      // Act
      const result = await service.list({});

      // Assert
      expect(result).toEqual({ data: [{ code: 'BG_CHECK' }] });
    });
  });

  describe('update', () => {
    it('debe lanzar NotFoundException si el tipo no existe', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update('ref-1', { isActive: false }, 'staff-ref'),
      ).rejects.toThrow(NotFoundException);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('debe actualizar por el id interno resuelto desde el referenceId', async () => {
      // Arrange
      mockFindByReferenceId.mockResolvedValue({ id: 7, referenceId: 'ref-1' });
      mockUpdate.mockResolvedValue({ id: 7, isActive: false });

      // Act
      await service.update('ref-1', { isActive: false }, 'staff-ref');

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(7, {
        isActive: false,
        lastChangedBy: 'staff-ref',
      });
    });
  });

  // DEF-BE-010: code duplicado => 409 (no 500)
  describe('código duplicado (P2002)', () => {
    const p2002 = () =>
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      });

    it('create lanza ConflictException ante P2002', async () => {
      mockCreate.mockRejectedValue(p2002());

      await expect(
        service.create({ code: 'X' } as never, 'admin'),
      ).rejects.toThrow(ConflictException);
    });

    it('update lanza ConflictException ante P2002', async () => {
      mockFindByReferenceId.mockResolvedValue({ id: 1 });
      mockUpdate.mockRejectedValue(p2002());

      await expect(
        service.update('ref', { code: 'X' }, 'admin'),
      ).rejects.toThrow(ConflictException);
    });

    it('propaga cualquier otro error sin convertirlo', async () => {
      const boom = new Error('db caída');
      mockCreate.mockRejectedValue(boom);

      await expect(service.create({} as never, 'admin')).rejects.toBe(boom);
    });
  });
});
