import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
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
import { LegalConsentsService } from '../services/legal-consents.service';
import {
  CreateLegalDocumentVersionRequestDTO,
  GetContentConsentGrantsAuditQueryDTO,
  GetLegalConsentsAuditQueryDTO,
  GetLegalDocumentVersionsQueryDTO,
  LegalDocumentVersionIdParamDTO,
  UpdateLegalDocumentVersionRequestDTO,
  UpsertRetentionPolicyRequestDTO,
} from '../dtos/request';
import {
  ContentConsentGrantsAuditListResponseDTO,
  LegalConsentsAuditListResponseDTO,
  LegalDocumentVersionResponseDTO,
  RetentionPolicyResponseDTO,
} from '../dtos/response';
import {
  ApiCreateLegalDocumentVersion,
  ApiGetContentConsentGrantsAudit,
  ApiGetLegalConsentsAudit,
  ApiGetLegalDocumentVersions,
  ApiGetRetentionPolicies,
  ApiUpdateLegalDocumentVersion,
  ApiUpsertRetentionPolicy,
} from '../docs/legal-consents.docs';

@ApiTags('Consentimiento legal (staff)')
@Controller('admin/legal')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminLegalConsentsController {
  constructor(private readonly legalConsentsService: LegalConsentsService) {}

  @Get('document-versions')
  @Permissions(PERMISSIONS.LEGAL.CONFIG_MANAGE, PERMISSIONS.ADMIN.ALL)
  @ApiGetLegalDocumentVersions()
  async getDocumentVersions(
    @Query() query: GetLegalDocumentVersionsQueryDTO,
  ): Promise<LegalDocumentVersionResponseDTO[]> {
    return this.legalConsentsService.findDocumentVersions(query);
  }

  @Post('document-versions')
  @Permissions(PERMISSIONS.LEGAL.CONFIG_MANAGE, PERMISSIONS.ADMIN.ALL)
  @ApiCreateLegalDocumentVersion()
  async createDocumentVersion(
    @Body() dto: CreateLegalDocumentVersionRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<LegalDocumentVersionResponseDTO> {
    return this.legalConsentsService.createDocumentVersion(
      dto,
      req.user.referenceId,
    );
  }

  @Patch('document-versions/:referenceId')
  @Permissions(PERMISSIONS.LEGAL.CONFIG_MANAGE, PERMISSIONS.ADMIN.ALL)
  @ApiUpdateLegalDocumentVersion()
  async updateDocumentVersion(
    @Param() param: LegalDocumentVersionIdParamDTO,
    @Body() dto: UpdateLegalDocumentVersionRequestDTO,
    @Request() req: { user: IUserDataOnJwt },
  ): Promise<LegalDocumentVersionResponseDTO> {
    return this.legalConsentsService.updateDocumentVersion(
      param.referenceId,
      dto,
      req.user.referenceId,
    );
  }

  @Get('retention-policies')
  @Permissions(PERMISSIONS.LEGAL.CONFIG_MANAGE, PERMISSIONS.ADMIN.ALL)
  @ApiGetRetentionPolicies()
  async getRetentionPolicies(): Promise<RetentionPolicyResponseDTO[]> {
    return this.legalConsentsService.findRetentionPolicies();
  }

  @Patch('retention-policies')
  @Permissions(PERMISSIONS.LEGAL.CONFIG_MANAGE, PERMISSIONS.ADMIN.ALL)
  @ApiUpsertRetentionPolicy()
  async upsertRetentionPolicy(
    @Body() dto: UpsertRetentionPolicyRequestDTO,
  ): Promise<RetentionPolicyResponseDTO> {
    return this.legalConsentsService.upsertRetentionPolicy(dto);
  }

  @Get('consents')
  @Permissions(PERMISSIONS.LEGAL.CONSENT_AUDIT_VIEW, PERMISSIONS.ADMIN.ALL)
  @ApiGetLegalConsentsAudit()
  async getConsentsAudit(
    @Query() query: GetLegalConsentsAuditQueryDTO,
  ): Promise<LegalConsentsAuditListResponseDTO> {
    return this.legalConsentsService.findConsentsAuditPaginated(query);
  }

  @Get('content-consents')
  @Permissions(PERMISSIONS.LEGAL.CONSENT_AUDIT_VIEW, PERMISSIONS.ADMIN.ALL)
  @ApiGetContentConsentGrantsAudit()
  async getContentConsentGrantsAudit(
    @Query() query: GetContentConsentGrantsAuditQueryDTO,
  ): Promise<ContentConsentGrantsAuditListResponseDTO> {
    return this.legalConsentsService.findContentConsentGrantsAuditPaginated(
      query,
    );
  }
}
