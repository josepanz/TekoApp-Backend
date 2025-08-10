import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsService, FileInfo } from './uploads.service';
import { promises as fs } from 'fs';
import { join } from 'path';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<FileInfo> {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }

    await this.uploadsService.validateFile(file);
    return this.uploadsService.processImage(file);
  }

  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File): Promise<FileInfo> {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }

    await this.uploadsService.validateFile(file);
    return this.uploadsService.processDocument(file);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Request() req): Promise<FileInfo> {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }

    // Solo permitir imágenes para avatares
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Solo se permiten imágenes para avatares');
    }

    await this.uploadsService.validateFile(file);
    const fileInfo = await this.uploadsService.processImage(file);
    
    // Crear thumbnail para el avatar
    await this.uploadsService.createThumbnail(fileInfo.filename, 150, 150);
    
    return fileInfo;
  }

  @Get(':filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const fileInfo = await this.uploadsService.getFileInfo(filename);
      const filePath = fileInfo.path;
      
      res.setHeader('Content-Type', fileInfo.mimetype);
      res.setHeader('Content-Disposition', `inline; filename="${fileInfo.originalname}"`);
      
      res.sendFile(filePath);
    } catch (error) {
      res.status(404).json({ message: 'Archivo no encontrado' });
    }
  }

  @Get(':filename/thumbnail')
  async getThumbnail(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const thumbnailName = `thumb_${filename}`;
      const fileInfo = await this.uploadsService.getFileInfo(thumbnailName);
      const filePath = fileInfo.path;
      
      res.setHeader('Content-Type', fileInfo.mimetype);
      res.setHeader('Content-Disposition', `inline; filename="thumb_${filename}"`);
      
      res.sendFile(filePath);
    } catch (error) {
      // Si no existe el thumbnail, crearlo y luego enviarlo
      try {
        const thumbnailName = await this.uploadsService.createThumbnail(filename);
        const fileInfo = await this.uploadsService.getFileInfo(thumbnailName);
        const filePath = fileInfo.path;
        
        res.setHeader('Content-Type', fileInfo.mimetype);
        res.setHeader('Content-Disposition', `inline; filename="${thumbnailName}"`);
        
        res.sendFile(filePath);
      } catch (thumbnailError) {
        res.status(404).json({ message: 'No se pudo generar el thumbnail' });
      }
    }
  }

  @Get(':filename/info')
  async getFileInfo(@Param('filename') filename: string): Promise<FileInfo> {
    return this.uploadsService.getFileInfo(filename);
  }

  @Delete(':filename')
  async deleteFile(@Param('filename') filename: string, @Request() req) {
    // Aquí podrías agregar lógica adicional para verificar permisos
    // Por ejemplo, solo permitir que el usuario elimine sus propios archivos
    
    await this.uploadsService.deleteFile(filename);
    return { message: 'Archivo eliminado exitosamente' };
  }

  @Post('bulk')
  @UseInterceptors(FileInterceptor('files'))
  async uploadMultipleFiles(@UploadedFile() files: Express.Multer.File[]): Promise<FileInfo[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se han subido archivos');
    }

    const results: FileInfo[] = [];
    
    for (const file of files) {
      try {
        await this.uploadsService.validateFile(file);
        
        let fileInfo: FileInfo;
        if (file.mimetype.startsWith('image/')) {
          fileInfo = await this.uploadsService.processImage(file);
        } else {
          fileInfo = await this.uploadsService.processDocument(file);
        }
        
        results.push(fileInfo);
      } catch (error) {
        // Continuar con el siguiente archivo si hay error
        console.error(`Error procesando archivo ${file.originalname}:`, error);
      }
    }

    return results;
  }
}
