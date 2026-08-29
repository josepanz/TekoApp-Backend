import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { Permissions } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { ProfessionalDocumentTypesService } from '../services/professional-document-types.service';
import {
  CreateProfessionalDocumentTypeRequestDTO,
  GetProfessionalDocumentTypesListQueryDTO,
  ProfessionalDocumentTypeReferenceParamDTO,
  UpdateProfessionalDocumentTypeRequestDTO,
} from '../dtos/request';
import {
  ProfessionalDocumentTypeResponseDTO,
  ProfessionalDocumentTypesListResponseDTO,
} from '../dtos/response';
import {
  ApiCreateProfessionalDocumentType,
  ApiGetProfessionalDocumentTypes,
  ApiUpdateProfessionalDocumentType,
} from '../docs/professional-document-types.docs';

interface RequestWithUser {
  user: IUserDataOnJwt;
}

@ApiTags('professional-document-types')
@Controller('professional-document-types')
@UseGuards(JwtAuthGuard)
export class ProfessionalDocumentTypesController {
  constructor(private readonly service: ProfessionalDocumentTypesService) {}

  @Get()
  @ApiGetProfessionalDocumentTypes()
  async list(
    @Query() query: GetProfessionalDocumentTypesListQueryDTO,
  ): Promise<ProfessionalDocumentTypesListResponseDTO> {
    return this.service.list(query);
  }
}

@ApiTags('professional-document-types (staff)')
@Controller('admin/professional-document-types')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminProfessionalDocumentTypesController {
  constructor(private readonly service: ProfessionalDocumentTypesService) {}

  @Post()
  @Permissions(
    PERMISSIONS.PROFESSIONAL_DOCUMENT_TYPES.MANAGE,
    PERMISSIONS.ADMIN.ALL,
  )
  @ApiCreateProfessionalDocumentType()
  async create(
    @Body() dto: CreateProfessionalDocumentTypeRequestDTO,
    @Request() req: RequestWithUser,
  ): Promise<ProfessionalDocumentTypeResponseDTO> {
    return this.service.create(dto, req.user.referenceId);
  }

  @Patch(':referenceId')
  @Permissions(
    PERMISSIONS.PROFESSIONAL_DOCUMENT_TYPES.MANAGE,
    PERMISSIONS.ADMIN.ALL,
  )
  @ApiUpdateProfessionalDocumentType()
  async update(
    @Param() param: ProfessionalDocumentTypeReferenceParamDTO,
    @Body() dto: UpdateProfessionalDocumentTypeRequestDTO,
    @Request() req: RequestWithUser,
  ): Promise<ProfessionalDocumentTypeResponseDTO> {
    return this.service.update(param.referenceId, dto, req.user.referenceId);
  }
}
