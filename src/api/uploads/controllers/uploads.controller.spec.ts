import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from '../services/uploads.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { FileInfoResponseDTO } from '../dtos/response';

// ── mocks de nivel de módulo ─────────────────────────────────────────────────
const mockUploadImage = jest.fn();
const mockUploadDocument = jest.fn();
const mockUploadAvatar = jest.fn();
const mockUploadMerchantDocs = jest.fn();
const mockGetPresignedUrl = jest.fn();
const mockDeleteFile = jest.fn();
const mockValidateFile = jest.fn();

// ── helpers ───────────────────────────────────────────────────────────────────
const buildMulterFile = (
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'foto.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  filename: 'abc123.jpg',
  size: 1024,
  buffer: Buffer.from(''),
  destination: '',
  path: '',
  stream: null,
  ...overrides,
});

const mockFileInfo: FileInfoResponseDTO = {
  filename: 'abc123.jpg',
  originalname: 'foto.jpg',
  mimetype: 'image/jpeg',
  size: 1024,
  key: 'abc123.jpg',
  url: 'https://s3.amazonaws.com/bucket/abc123.jpg?signed=1',
};

const makeUser = (id = 1, referenceId = 'ref-001') => ({
  id,
  referenceId,
});

describe('UploadsController', () => {
  let controller: UploadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: UploadsService,
          useValue: {
            uploadImage: mockUploadImage,
            uploadDocument: mockUploadDocument,
            uploadAvatar: mockUploadAvatar,
            uploadMerchantDocs: mockUploadMerchantDocs,
            getPresignedUrl: mockGetPresignedUrl,
            deleteFile: mockDeleteFile,
            validateFile: mockValidateFile,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<UploadsController>(UploadsController);
  });

  afterEach(() => jest.clearAllMocks());

  // ── uploadImage ───────────────────────────────────────────────────────────
  describe('uploadImage', () => {
    it('debe retornar FileInfoResponseDTO cuando el archivo es válido', async () => {
      // Arrange
      const file = buildMulterFile();
      mockUploadImage.mockResolvedValue(mockFileInfo);

      // Act
      const result = await controller.uploadImage(file);

      // Assert
      expect(mockUploadImage).toHaveBeenCalledWith(file);
      expect(result).toEqual(mockFileInfo);
    });

    it('debe lanzar BadRequestException si no se provee archivo', async () => {
      // Arrange
      const file = undefined as unknown as Express.Multer.File;

      // Act & Assert
      await expect(controller.uploadImage(file)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.uploadImage(file)).rejects.toThrow(
        'No se ha subido ningún archivo',
      );
    });
  });

  // ── uploadDocument ────────────────────────────────────────────────────────
  describe('uploadDocument', () => {
    it('debe retornar FileInfoResponseDTO cuando el documento es válido', async () => {
      // Arrange
      const file = buildMulterFile({
        mimetype: 'application/pdf',
        originalname: 'doc.pdf',
      });
      mockUploadDocument.mockResolvedValue({
        ...mockFileInfo,
        mimetype: 'application/pdf',
      });

      // Act
      const result = await controller.uploadDocument(file);

      // Assert
      expect(mockUploadDocument).toHaveBeenCalledWith(file);
      expect(result.mimetype).toBe('application/pdf');
    });

    it('debe lanzar BadRequestException si no se provee archivo', async () => {
      // Arrange
      const file = undefined as unknown as Express.Multer.File;

      // Act & Assert
      await expect(controller.uploadDocument(file)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── uploadAvatar ──────────────────────────────────────────────────────────
  describe('uploadAvatar', () => {
    it('debe retornar FileInfoResponseDTO cuando la imagen es válida', async () => {
      // Arrange
      const file = buildMulterFile();
      mockUploadAvatar.mockResolvedValue(mockFileInfo);

      // Act
      const result = await controller.uploadAvatar(file);

      // Assert
      expect(mockUploadAvatar).toHaveBeenCalledWith(file);
      expect(result).toEqual(mockFileInfo);
    });

    it('debe lanzar BadRequestException si no se provee archivo', async () => {
      // Arrange
      const file = undefined as unknown as Express.Multer.File;

      // Act & Assert
      await expect(controller.uploadAvatar(file)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── uploadMerchantDocs ────────────────────────────────────────────────────
  describe('uploadMerchantDocs', () => {
    it('debe subir documentos de merchant y retornar void', async () => {
      // Arrange
      const body = { documentType: '2', documentNumber: '12345678' } as never;
      const files: Record<string, Express.Multer.File[]> = {
        documentFrontImage: [
          buildMulterFile({ fieldname: 'documentFrontImage' }),
        ],
      };
      const user = makeUser(42, 'ref-abc');
      mockUploadMerchantDocs.mockResolvedValue(undefined);

      // Act
      const result = await controller.uploadMerchantDocs(
        body,
        files,
        user as never,
      );

      // Assert
      expect(result).toBeUndefined();
      expect(mockUploadMerchantDocs).toHaveBeenCalledWith({
        files,
        userId: 42,
        referenceId: 'ref-abc',
        documentType: 2,
        documentNumber: '12345678',
      });
    });

    it('debe pasar documentType como null cuando no se proporciona', async () => {
      // Arrange
      const body = { documentNumber: '99999' } as never;
      const files: Record<string, Express.Multer.File[]> = {};
      const user = makeUser(10, 'ref-xyz');
      mockUploadMerchantDocs.mockResolvedValue(undefined);

      // Act
      await controller.uploadMerchantDocs(body, files, user as never);

      // Assert
      expect(mockUploadMerchantDocs).toHaveBeenCalledWith(
        expect.objectContaining({ documentType: null }) as unknown,
      );
    });
  });

  // ── getPresignedUrl ───────────────────────────────────────────────────────
  describe('getPresignedUrl', () => {
    it('debe retornar url presignada cuando se proporciona key', async () => {
      // Arrange
      const key = 'abc123.jpg';
      mockGetPresignedUrl.mockResolvedValue(
        'https://s3.example.com/abc123?signed=1',
      );

      // Act
      const result = await controller.getPresignedUrl(key);

      // Assert
      expect(mockGetPresignedUrl).toHaveBeenCalledWith(key);
      expect(result).toEqual({ url: 'https://s3.example.com/abc123?signed=1' });
    });

    it('debe lanzar BadRequestException si key es vacío', async () => {
      // Act & Assert
      await expect(controller.getPresignedUrl('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── deleteFile ────────────────────────────────────────────────────────────
  describe('deleteFile', () => {
    it('debe retornar mensaje de éxito cuando se elimina el archivo', async () => {
      // Arrange
      const param = { filename: 'abc123.jpg' };
      mockDeleteFile.mockResolvedValue(undefined);

      // Act
      const result = await controller.deleteFile(param);

      // Assert
      expect(mockDeleteFile).toHaveBeenCalledWith('abc123.jpg');
      expect(result).toEqual({ message: 'Archivo eliminado exitosamente' });
    });
  });
});
