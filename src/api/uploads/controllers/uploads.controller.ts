import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Version,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { User } from '@common/decorators/user.decorator';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import {
  FileUploader,
  UploadedFilesValidated,
} from '@common/decorators/file-uploader.decorator';
import { UploadsService } from '../services/uploads.service';
import { FileInfoResponseDTO } from '../dtos/response';
import {
  UploadFileParamDTO,
  UploadMerchantDocsRequestDTO,
} from '../dtos/request';
import {
  MERCHANT_DOC_ALLOWED_MIME_TYPES,
  MERCHANT_DOC_FIELDS,
} from '../const/uploads.const';
import {
  DeleteFileDocs,
  GetPresignedUrlDocs,
  UploadAvatarDocs,
  UploadDocumentDocs,
  UploadImageDocs,
  UploadMerchantDocsDocs,
} from '../docs/uploads.docs';

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @Version('1')
  @UseInterceptors(FileInterceptor('file'))
  @UploadImageDocs()
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FileInfoResponseDTO> {
    if (!file) throw new BadRequestException('No se ha subido ningún archivo');
    return this.uploadsService.uploadImage(file);
  }

  @Post('document')
  @Version('1')
  @UseInterceptors(FileInterceptor('file'))
  @UploadDocumentDocs()
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FileInfoResponseDTO> {
    if (!file) throw new BadRequestException('No se ha subido ningún archivo');
    return this.uploadsService.uploadDocument(file);
  }

  @Post('avatar')
  @Version('1')
  @UseInterceptors(FileInterceptor('file'))
  @UploadAvatarDocs()
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FileInfoResponseDTO> {
    if (!file) throw new BadRequestException('No se ha subido ningún archivo');
    return this.uploadsService.uploadAvatar(file);
  }

  @Post('merchant-docs')
  @Version('1')
  @FileUploader({
    fields: MERCHANT_DOC_FIELDS,
    allowedTypes: MERCHANT_DOC_ALLOWED_MIME_TYPES,
  })
  @UploadMerchantDocsDocs()
  async uploadMerchantDocs(
    @Body() body: UploadMerchantDocsRequestDTO,
    @UploadedFilesValidated() files: Record<string, Express.Multer.File[]>,
    @User() user: IUserDataOnJwt,
  ): Promise<void> {
    return this.uploadsService.uploadMerchantDocs({
      files,
      userId: user.id,
      referenceId: user.referenceId,
      documentType: body.documentType ? Number(body.documentType) : null,
      documentNumber: body.documentNumber,
    });
  }

  @Get('presigned-url')
  @Version('1')
  @GetPresignedUrlDocs()
  @ApiQuery({
    name: 'key',
    required: true,
    description: 'Clave S3 del archivo',
  })
  async getPresignedUrl(@Query('key') key: string): Promise<{ url: string }> {
    if (!key) throw new BadRequestException('El parámetro key es requerido');
    const url = await this.uploadsService.getPresignedUrl(key);
    return { url };
  }

  @Get('info/:filename')
  @Version('1')
  async getFileInfo(
    @Param() param: UploadFileParamDTO,
  ): Promise<{ url: string; key: string }> {
    const url = await this.uploadsService.getPresignedUrl(param.filename);
    return { key: param.filename, url };
  }

  @Delete(':filename')
  @Version('1')
  @DeleteFileDocs()
  async deleteFile(
    @Param() param: UploadFileParamDTO,
  ): Promise<{ message: string }> {
    await this.uploadsService.deleteFile(param.filename);
    return { message: 'Archivo eliminado exitosamente' };
  }
}
