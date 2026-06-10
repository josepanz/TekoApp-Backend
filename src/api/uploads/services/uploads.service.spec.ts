import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { StorageService } from '@modules/storage/services/storage.service';
import { UsersDBService } from '@modules/users-db/services/users-db.service';
import { MAX_FILE_SIZE } from '../const/uploads.const';

jest.mock('sharp', () => {
  const processedBuffer = Buffer.from('processed-image-data');
  const instance = {
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(processedBuffer),
  };
  return jest.fn().mockReturnValue(instance);
});

const mockUploadFilesQueue = jest.fn();
const mockGetPresignedUrlQueue = jest.fn();
const mockDeleteFilesQueue = jest.fn();
const mockUpdateDocumentInfo = jest.fn();

function buildFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'foto.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 512,
    buffer: Buffer.from('fake-image-data'),
    destination: '',
    filename: '',
    path: '',
    stream: null,
    ...overrides,
  };
}

describe('UploadsService', () => {
  let service: UploadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        {
          provide: StorageService,
          useValue: {
            uploadFilesQueue: mockUploadFilesQueue,
            getPresignedUrlQueue: mockGetPresignedUrlQueue,
            deleteFilesQueue: mockDeleteFilesQueue,
          },
        },
        {
          provide: UsersDBService,
          useValue: { updateDocumentInfo: mockUpdateDocumentInfo },
        },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('validateFile', () => {
    it('debe lanzar BadRequestException cuando el archivo supera el tamaño máximo', () => {
      const file = buildFile({ size: MAX_FILE_SIZE + 1 });
      expect(() => service.validateFile(file)).toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException cuando imageOnly=true y el mime no es imagen', () => {
      const file = buildFile({ mimetype: 'application/pdf' });
      expect(() => service.validateFile(file, true)).toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException cuando el tipo MIME no está en la lista permitida', () => {
      const file = buildFile({ mimetype: 'application/zip' });
      expect(() => service.validateFile(file)).toThrow(BadRequestException);
    });

    it('no debe lanzar excepción con imagen JPEG válida', () => {
      expect(() => service.validateFile(buildFile())).not.toThrow();
    });

    it('no debe lanzar excepción con PDF cuando imageOnly es false', () => {
      expect(() =>
        service.validateFile(buildFile({ mimetype: 'application/pdf' })),
      ).not.toThrow();
    });
  });

  describe('uploadImage', () => {
    beforeEach(() => {
      mockUploadFilesQueue.mockResolvedValue([{ key: 'img-key.jpg' }]);
      mockGetPresignedUrlQueue.mockResolvedValue(
        'https://s3.example.com/img-key.jpg',
      );
    });

    it('debe subir la imagen procesada y retornar FileInfoResponseDTO con los campos correctos', async () => {
      const result = await service.uploadImage(buildFile());

      expect(result).toMatchObject({
        originalname: 'foto.jpg',
        key: 'img-key.jpg',
        url: 'https://s3.example.com/img-key.jpg',
        size: 512,
      });
    });

    it('debe llamar al storage exactamente una vez', async () => {
      await service.uploadImage(buildFile());
      expect(mockUploadFilesQueue).toHaveBeenCalledTimes(1);
    });

    it('debe rechazar con BadRequestException cuando el archivo supera el tamaño máximo', async () => {
      await expect(
        service.uploadImage(buildFile({ size: MAX_FILE_SIZE + 1 })),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar InternalServerErrorException cuando el storage falla', async () => {
      mockUploadFilesQueue.mockRejectedValue(new Error('S3 timeout'));
      await expect(service.uploadImage(buildFile())).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('uploadDocument', () => {
    beforeEach(() => {
      mockUploadFilesQueue.mockResolvedValue([{ key: 'doc-key.pdf' }]);
      mockGetPresignedUrlQueue.mockResolvedValue(
        'https://s3.example.com/doc-key.pdf',
      );
    });

    it('debe subir el documento y retornar FileInfoResponseDTO', async () => {
      const file = buildFile({
        originalname: 'contrato.pdf',
        mimetype: 'application/pdf',
      });
      const result = await service.uploadDocument(file);

      expect(result.key).toBe('doc-key.pdf');
      expect(result.originalname).toBe('contrato.pdf');
    });

    it('debe rechazar con BadRequestException cuando el tipo MIME no está permitido', async () => {
      await expect(
        service.uploadDocument(buildFile({ mimetype: 'application/zip' })),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar InternalServerErrorException cuando el storage falla', async () => {
      mockUploadFilesQueue.mockRejectedValue(new Error('Connection refused'));
      await expect(
        service.uploadDocument(buildFile({ mimetype: 'application/pdf' })),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('uploadAvatar', () => {
    beforeEach(() => {
      mockUploadFilesQueue.mockResolvedValue([{ key: 'avatar-key.jpg' }]);
      mockGetPresignedUrlQueue.mockResolvedValue(
        'https://s3.example.com/avatar-key.jpg',
      );
    });

    it('debe subir el avatar y el thumbnail, retornando el DTO del avatar principal', async () => {
      const result = await service.uploadAvatar(buildFile());

      expect(mockUploadFilesQueue).toHaveBeenCalledTimes(2);
      expect(result.key).toBe('avatar-key.jpg');
    });

    it('debe forzar mimetype image/jpeg en la respuesta del avatar', async () => {
      const result = await service.uploadAvatar(
        buildFile({ mimetype: 'image/png' }),
      );
      expect(result.mimetype).toBe('image/jpeg');
    });

    it('debe rechazar con BadRequestException cuando el archivo no es una imagen', async () => {
      await expect(
        service.uploadAvatar(buildFile({ mimetype: 'application/pdf' })),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadMerchantDocs', () => {
    const mockFile = buildFile({ originalname: 'documento.jpg' });

    beforeEach(() => {
      mockUploadFilesQueue.mockResolvedValue([
        { key: 'front-key.jpg', id: 'documentFrontImage' },
      ]);
      mockUpdateDocumentInfo.mockResolvedValue(undefined);
    });

    it('debe subir los documentos y actualizar la información del usuario', async () => {
      await service.uploadMerchantDocs({
        files: { documentFrontImage: [mockFile] },
        userId: 42,
        referenceId: 'ref-abc',
        documentType: 1,
        documentNumber: 'CI-123456',
      });

      expect(mockUploadFilesQueue).toHaveBeenCalledTimes(1);
      expect(mockUpdateDocumentInfo).toHaveBeenCalledWith(42, 'CI-123456', 1);
    });

    it('debe pasar null a updateDocumentInfo cuando documentType y documentNumber no se proveen', async () => {
      await service.uploadMerchantDocs({
        files: { documentFrontImage: [mockFile] },
        userId: 7,
        referenceId: 'ref-xyz',
      });

      expect(mockUpdateDocumentInfo).toHaveBeenCalledWith(7, null, null);
    });

    it('debe lanzar InternalServerErrorException cuando falla la subida de archivos a S3', async () => {
      mockUploadFilesQueue.mockRejectedValue(new Error('S3 unavailable'));

      await expect(
        service.uploadMerchantDocs({
          files: { documentFrontImage: [mockFile] },
          userId: 1,
          referenceId: 'ref-err',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('no debe llamar updateDocumentInfo cuando falla la subida de archivos', async () => {
      mockUploadFilesQueue.mockRejectedValue(new Error('S3 error'));

      await expect(
        service.uploadMerchantDocs({
          files: { documentFrontImage: [mockFile] },
          userId: 1,
          referenceId: 'ref-err',
        }),
      ).rejects.toThrow();

      expect(mockUpdateDocumentInfo).not.toHaveBeenCalled();
    });
  });

  describe('getPresignedUrl', () => {
    it('debe retornar la URL presignada para la clave dada', async () => {
      mockGetPresignedUrlQueue.mockResolvedValue(
        'https://cdn.example.com/file.jpg',
      );

      const url = await service.getPresignedUrl('file-key.jpg');

      expect(mockGetPresignedUrlQueue).toHaveBeenCalledWith({
        key: 'file-key.jpg',
      });
      expect(url).toBe('https://cdn.example.com/file.jpg');
    });
  });

  describe('deleteFile', () => {
    it('debe eliminar el archivo del storage exitosamente', async () => {
      mockDeleteFilesQueue.mockResolvedValue(undefined);

      await service.deleteFile('archivo.jpg');

      expect(mockDeleteFilesQueue).toHaveBeenCalledWith(['archivo.jpg']);
    });

    it('debe lanzar BadRequestException cuando falla la eliminación', async () => {
      mockDeleteFilesQueue.mockRejectedValue(new Error('Access denied'));

      await expect(service.deleteFile('archivo.jpg')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
