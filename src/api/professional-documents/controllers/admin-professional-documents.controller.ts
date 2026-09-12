import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { ProfessionalDocumentsService } from '../services/professional-documents.service';
import {
  GetAdminProfessionalDocumentsQueryDTO,
  ProfessionalDocumentReferenceParamDTO,
  ProfessionalReferenceParamDTO,
  ReviewProfessionalDocumentRequestDTO,
} from '../dtos/request';
import {
  AdminProfessionalDocumentsListResponseDTO,
  ProfessionalDocumentResponseDTO,
  ProfessionalDocumentsListResponseDTO,
} from '../dtos/response';
import {
  ApiGetAdminProfessionalDocuments,
  ApiGetAdminProfessionalDocumentsQueue,
  ApiReviewProfessionalDocument,
} from '../docs/professional-documents.docs';

interface RequestWithUser {
  user: IUserDataOnJwt;
}

@ApiTags('professional-documents (staff)')
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
// Este `@Permissions` de clase SÍ protege desde que `PermissionsGuard.canActivate` usa
// `reflector.getAllAndOverride(KEY, [getHandler(), getClass()])` — antes leía SOLO el handler y
// este decorador de clase era decorativo (ver openspec/decisions.md). Se mantiene el
// `@Permissions` repetido en cada método de todos modos: si algún método cambia de permiso
// requerido, el de método tiene precedencia sobre el de clase. Hallazgo real (2026-09-11): los 3
// métodos de este controller estuvieron sin decorar, dejando `GET admin/professional-documents`,
// `GET admin/professionals/:referenceId/documents` y
// `PATCH admin/professional-documents/:referenceId/review` accesibles a cualquier usuario logueado
// — ver openspec/decisions.md.
@Permissions(PERMISSIONS.PROFESSIONAL_DOCUMENTS.REVIEW, PERMISSIONS.ADMIN.ALL)
export class AdminProfessionalDocumentsController {
  constructor(private readonly service: ProfessionalDocumentsService) {}

  @Get('admin/professional-documents')
  @Permissions(PERMISSIONS.PROFESSIONAL_DOCUMENTS.REVIEW, PERMISSIONS.ADMIN.ALL)
  @ApiGetAdminProfessionalDocumentsQueue()
  async queue(
    @Query() query: GetAdminProfessionalDocumentsQueryDTO,
  ): Promise<AdminProfessionalDocumentsListResponseDTO> {
    return this.service.adminQueue(query);
  }

  @Get('admin/professionals/:referenceId/documents')
  @Permissions(PERMISSIONS.PROFESSIONAL_DOCUMENTS.REVIEW, PERMISSIONS.ADMIN.ALL)
  @ApiGetAdminProfessionalDocuments()
  async byProfessional(
    @Param() param: ProfessionalReferenceParamDTO,
  ): Promise<ProfessionalDocumentsListResponseDTO> {
    return this.service.adminDocuments(param.referenceId);
  }

  @Patch('admin/professional-documents/:referenceId/review')
  @Permissions(PERMISSIONS.PROFESSIONAL_DOCUMENTS.REVIEW, PERMISSIONS.ADMIN.ALL)
  @ApiReviewProfessionalDocument()
  async review(
    @Param() param: ProfessionalDocumentReferenceParamDTO,
    @Body() dto: ReviewProfessionalDocumentRequestDTO,
    @Request() req: RequestWithUser,
  ): Promise<ProfessionalDocumentResponseDTO> {
    return this.service.review(
      param.referenceId,
      dto.status,
      dto.rejectionReason,
      req.user.referenceId,
    );
  }
}
