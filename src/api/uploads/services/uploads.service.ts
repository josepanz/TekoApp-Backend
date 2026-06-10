import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { extname } from 'path';
import { StorageService } from '@modules/storage/services/storage.service';
import { StorageUploadInput } from '@modules/storage/interfaces/storage.interface';
import { UsersDBService } from '@modules/users-db/services/users-db.service';
import { FileInfoResponseDTO } from '../dtos/response';
import {
  IUploadedDocUrls,
  IUploadMerchantDocsParams,
} from '../interfaces/uploads.interface';
import {
  ALLOWED_MIME_TYPES,
  IMAGE_PROCESSING,
  MAX_FILE_SIZE,
} from '../const/uploads.const';

// Sharp es opcional — carga lazy para arrancar sin el binario nativo
let sharp: typeof import('sharp') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  sharp = require('sharp') as typeof import('sharp');
} catch {
  // Native binary not available — image processing se omite
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly usersDbService: UsersDBService,
  ) {}

  async uploadImage(file: Express.Multer.File): Promise<FileInfoResponseDTO> {
    this.validateFile(file);
    const processedBuffer = await this.processImageBuffer(file.buffer);
    const key = this.buildKey(file.originalname);
    return this.uploadToS3(
      {
        ...file,
        buffer: processedBuffer,
        mimetype:
          processedBuffer !== file.buffer ? 'image/jpeg' : file.mimetype,
      },
      key,
    );
  }

  async uploadDocument(
    file: Express.Multer.File,
  ): Promise<FileInfoResponseDTO> {
    this.validateFile(file);
    const key = this.buildKey(file.originalname);
    return this.uploadToS3(file, key);
  }

  async uploadAvatar(file: Express.Multer.File): Promise<FileInfoResponseDTO> {
    this.validateFile(file, true);
    const processedBuffer = await this.processImageBuffer(file.buffer);
    const key = this.buildKey(file.originalname);
    const result = await this.uploadToS3(
      { ...file, buffer: processedBuffer, mimetype: 'image/jpeg' },
      key,
    );

    const thumbBuffer = await this.createThumbnailBuffer(processedBuffer);
    if (thumbBuffer) {
      const thumbKey = this.buildKey(`thumb_${file.originalname}`);
      await this.uploadToS3(
        { ...file, buffer: thumbBuffer, mimetype: 'image/jpeg' },
        thumbKey,
      );
    }

    return result;
  }

  async uploadMerchantDocs(params: IUploadMerchantDocsParams): Promise<void> {
    const { files, userId, referenceId, documentType, documentNumber } = params;
    await this.uploadMerchantFilesToS3(files, referenceId);
    await this.usersDbService.updateDocumentInfo(
      userId,
      documentNumber ?? null,
      documentType ?? null,
    );
  }

  async getPresignedUrl(key: string): Promise<string> {
    return this.storageService.getPresignedUrlQueue({ key });
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.storageService.deleteFilesQueue([key]);
      this.logger.log(`Archivo eliminado: ${key}`);
    } catch (error: unknown) {
      this.logger.error(
        `Error eliminando archivo: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw new BadRequestException('Error eliminando el archivo');
    }
  }

  validateFile(file: Express.Multer.File, imageOnly = false): void {
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }
    if (imageOnly && !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Solo se permiten imágenes');
    }
    if (!imageOnly && !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido');
    }
  }

  private async uploadToS3(
    file: Express.Multer.File,
    key: string,
  ): Promise<FileInfoResponseDTO> {
    try {
      const input: StorageUploadInput = { file, key };
      const [result] = await this.storageService.uploadFilesQueue([input]);
      const url = await this.storageService.getPresignedUrlQueue({
        key: result.key,
      });

      return {
        filename: this.extractFilename(result.key),
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        key: result.key,
        url,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error al subir el archivo', {
        cause: error,
      });
    }
  }

  private async uploadMerchantFilesToS3(
    files: Record<string, Express.Multer.File[]>,
    referenceId: string,
  ): Promise<IUploadedDocUrls> {
    try {
      const uploadInputs: StorageUploadInput[] = Object.entries(files).flatMap(
        ([fieldName, fileGroup]) =>
          fileGroup.map((file) => ({
            id: fieldName,
            file,
            path: `onboarding/merchants/${referenceId}/1`,
          })),
      );
      const uploaded = await this.storageService.uploadFilesQueue(uploadInputs);
      return uploaded.reduce<IUploadedDocUrls>((acc, file) => {
        if (file.id) acc[file.id as keyof IUploadedDocUrls] = file.key;
        return acc;
      }, {});
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error al subir documentos de merchant',
        { cause: error },
      );
    }
  }

  private async processImageBuffer(buffer: Buffer): Promise<Buffer> {
    if (!sharp) return buffer;
    try {
      return await sharp(buffer)
        .resize(IMAGE_PROCESSING.maxWidth, IMAGE_PROCESSING.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: IMAGE_PROCESSING.quality })
        .toBuffer();
    } catch {
      return buffer;
    }
  }

  private async createThumbnailBuffer(buffer: Buffer): Promise<Buffer | null> {
    if (!sharp) return null;
    try {
      return await sharp(buffer)
        .resize(
          IMAGE_PROCESSING.thumbnailWidth,
          IMAGE_PROCESSING.thumbnailHeight,
          {
            fit: 'cover',
          },
        )
        .jpeg({ quality: IMAGE_PROCESSING.thumbnailQuality })
        .toBuffer();
    } catch {
      return null;
    }
  }

  private buildKey(originalname: string): string {
    const uuid = Array(16)
      .fill(null)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');
    const ext = extname(originalname);
    return `${uuid}${ext}`;
  }

  private extractFilename(key: string): string {
    return key.split('/').pop() ?? key;
  }
}
