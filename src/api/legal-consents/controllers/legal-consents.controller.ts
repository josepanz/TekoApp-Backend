import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { LegalConsentsService } from '../services/legal-consents.service';
import {
  AcceptConsentParamDTO,
  RevokeContentConsentParamDTO,
} from '../dtos/request';
import {
  DataConsentsHistoryResponseDTO,
  LegalDocumentVersionResponseDTO,
  UserConsentResponseDTO,
} from '../dtos/response';
import {
  ApiAcceptConsent,
  ApiGetDataConsentsHistory,
  ApiGetPendingConsents,
  ApiRevokeContentConsent,
} from '../docs/legal-consents.docs';

interface RequestWithUser {
  user: IUserDataOnJwt;
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}

@ApiTags('Consentimiento legal')
@Controller()
@UseGuards(JwtAuthGuard)
export class LegalConsentsController {
  constructor(private readonly legalConsentsService: LegalConsentsService) {}

  @Get('legal/consents/pending')
  @ApiGetPendingConsents()
  async getPending(
    @Request() req: RequestWithUser,
  ): Promise<LegalDocumentVersionResponseDTO[]> {
    return this.legalConsentsService.findPendingForUser(req.user.id);
  }

  @Post('legal/consents/:versionReferenceId/accept')
  @HttpCode(HttpStatus.CREATED)
  @ApiAcceptConsent()
  async accept(
    @Param() param: AcceptConsentParamDTO,
    @Request() req: RequestWithUser,
  ): Promise<UserConsentResponseDTO> {
    const ipAddress = req.ip ?? 'unknown';
    const userAgentRaw = req.headers['user-agent'] ?? 'unknown';
    const userAgent = Array.isArray(userAgentRaw)
      ? (userAgentRaw[0] ?? 'unknown')
      : userAgentRaw;

    return this.legalConsentsService.acceptVersion(
      req.user.id,
      param.versionReferenceId,
      ipAddress,
      userAgent,
    ) as unknown as Promise<UserConsentResponseDTO>;
  }

  @Get('users/me/data-consents')
  @ApiGetDataConsentsHistory()
  async getMyDataConsents(
    @Request() req: RequestWithUser,
  ): Promise<DataConsentsHistoryResponseDTO> {
    return this.legalConsentsService.findDataConsentsHistory(req.user.id);
  }

  @Delete('users/me/content/:contentReferenceId/consent')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRevokeContentConsent()
  async revokeContentConsent(
    @Param() param: RevokeContentConsentParamDTO,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    return this.legalConsentsService.revokeContentConsent(
      req.user.id,
      param.contentReferenceId,
    );
  }
}
