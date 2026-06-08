import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
// sharp is an optional native dependency; loaded lazily to allow startup without native binary
let sharp: typeof import('sharp') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  sharp = require('sharp') as typeof import('sharp');
} catch {
  // Native binary not available — image processing will be skipped
}

export interface FileInfo {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadPath: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadPath = this.configService.get<string>(
      'UPLOAD_PATH',
      './uploads',
    );
  }

  async processImage(file: Express.Multer.File): Promise<FileInfo> {
    try {
      const filePath = join(this.uploadPath, file.filename);

      // Procesar imagen con Sharp para optimización (si está disponible)
      if (sharp) {
        await sharp(filePath)
          .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(filePath + '.processed');
        await fs.unlink(filePath);
        await fs.rename(filePath + '.processed', filePath);
      }

      const stats = await fs.stat(filePath);

      return {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: stats.size,
        path: filePath,
        url: this.getFileUrl(file.filename),
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error procesando imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
      throw new BadRequestException('Error procesando la imagen');
    }
  }

  async processDocument(file: Express.Multer.File): Promise<FileInfo> {
    try {
      const filePath = join(this.uploadPath, file.filename);
      const stats = await fs.stat(filePath);

      return {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: stats.size,
        path: filePath,
        url: this.getFileUrl(file.filename),
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error procesando documento: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
      throw new BadRequestException('Error procesando el documento');
    }
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = join(this.uploadPath, filename);
      await fs.unlink(filePath);
      this.logger.log(`Archivo eliminado: ${filename}`);
    } catch (error: unknown) {
      this.logger.error(
        `Error eliminando archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
      throw new BadRequestException('Error eliminando el archivo');
    }
  }

  async getFileInfo(filename: string): Promise<FileInfo> {
    try {
      const filePath = join(this.uploadPath, filename);
      const stats = await fs.stat(filePath);

      return {
        filename,
        originalname: filename,
        mimetype: this.getMimeType(filename),
        size: stats.size,
        path: filePath,
        url: this.getFileUrl(filename),
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error obteniendo información del archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
      throw new BadRequestException('Archivo no encontrado');
    }
  }

  async createThumbnail(
    filename: string,
    width = 200,
    height = 200,
  ): Promise<string> {
    try {
      const filePath = join(this.uploadPath, filename);
      const thumbnailName = `thumb_${filename}`;
      const thumbnailPath = join(this.uploadPath, thumbnailName);

      if (!sharp) return filename;
      await sharp(filePath)
        .resize(width, height, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toFile(thumbnailPath);

      return thumbnailName;
    } catch (error: unknown) {
      this.logger.error(
        `Error creando thumbnail: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
      throw new BadRequestException('Error creando thumbnail');
    }
  }

  private getFileUrl(filename: string): string {
    const baseUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:3000',
    );
    return `${baseUrl}/uploads/${filename}`;
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  validateFile(file: Express.Multer.File): boolean {
    const maxSize = this.configService.get<number>(
      'MAX_FILE_SIZE',
      5 * 1024 * 1024,
    );

    if (file.size > maxSize) {
      throw new BadRequestException(
        `El archivo excede el tamaño máximo de ${maxSize / (1024 * 1024)}MB`,
      );
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido');
    }

    return true;
  }
}
