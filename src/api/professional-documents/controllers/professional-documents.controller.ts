import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { LegalDocumentType } from '@prisma/client';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { RequiresActiveConsentGuard } from '@api/legal-consents/guards/requires-active-consent.guard';
import { RequiresActiveConsent } from '@common/decorators/requires-active-consent.decorator';
import { ProfessionalDocumentsService } from '../services/professional-documents.service';
import {
  CreateProfessionalDocumentRequestDTO,
  ProfessionalReferenceParamDTO,
} from '../dtos/request';
import {
  MyDocumentsListResponseDTO,
  ProfessionalDocumentResponseDTO,
  ProfessionalDocumentsListResponseDTO,
} from '../dtos/response';
import {
  ApiGetMyProfessionalDocuments,
  ApiGetPublicProfessionalDocuments,
  ApiUploadProfessionalDocument,
} from '../docs/professional-documents.docs';

interface RequestWithUser {
  user: IUserDataOnJwt;
}

@ApiTags('professional-documents')
@Controller()
export class ProfessionalDocumentsController {
  constructor(private readonly service: ProfessionalDocumentsService) {}

  @Post('professionals/me/documents')
  @UseGuards(JwtAuthGuard, RequiresActiveConsentGuard)
  @RequiresActiveConsent(LegalDocumentType.DATA_PROCESSING_CONSENT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiUploadProfessionalDocument()
  async upload(
    @Body() dto: CreateProfessionalDocumentRequestDTO,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: RequestWithUser,
  ): Promise<ProfessionalDocumentResponseDTO> {
    return this.service.uploadDocument(
      req.user.id,
      dto,
      file,
      req.user.referenceId,
    );
  }

  @Get('professionals/me/documents')
  @UseGuards(JwtAuthGuard)
  @ApiGetMyProfessionalDocuments()
  async myDocuments(
    @Request() req: RequestWithUser,
  ): Promise<MyDocumentsListResponseDTO> {
    return this.service.myDocuments(req.user.id);
  }

  @Get('professionals/:referenceId/documents/public')
  @UseGuards(JwtAuthGuard)
  @ApiGetPublicProfessionalDocuments()
  async publicDocuments(
    @Param() param: ProfessionalReferenceParamDTO,
  ): Promise<ProfessionalDocumentsListResponseDTO> {
    return this.service.publicDocuments(param.referenceId);
  }
}
