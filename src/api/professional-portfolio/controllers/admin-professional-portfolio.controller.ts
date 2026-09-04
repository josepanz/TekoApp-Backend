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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { Permissions } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { ProfessionalPortfolioService } from '../services/professional-portfolio.service';
import {
  GetAdminPortfolioQueryDTO,
  PortfolioItemReferenceParamDTO,
  ReviewPortfolioItemRequestDTO,
} from '../dtos/request';
import {
  AdminPortfolioItemsListResponseDTO,
  PortfolioItemResponseDTO,
} from '../dtos/response';

interface RequestWithUser {
  user: IUserDataOnJwt;
}

@ApiTags('professional-portfolio (staff)')
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions(PERMISSIONS.PROFESSIONAL_PORTFOLIO.REVIEW, PERMISSIONS.ADMIN.ALL)
export class AdminProfessionalPortfolioController {
  constructor(private readonly service: ProfessionalPortfolioService) {}

  @Get('admin/professional-portfolio')
  @ApiOperation({ summary: 'Cola de revisión de fotos de portafolio (staff)' })
  @ApiResponse({ status: 200, type: AdminPortfolioItemsListResponseDTO })
  async queue(
    @Query() query: GetAdminPortfolioQueryDTO,
  ): Promise<AdminPortfolioItemsListResponseDTO> {
    return this.service.adminQueue(query);
  }

  @Patch('admin/professional-portfolio/:referenceId/review')
  @ApiOperation({
    summary: 'Aprobar o rechazar una foto de portafolio (staff)',
  })
  @ApiResponse({ status: 200, type: PortfolioItemResponseDTO })
  async review(
    @Param() param: PortfolioItemReferenceParamDTO,
    @Body() dto: ReviewPortfolioItemRequestDTO,
    @Request() req: RequestWithUser,
  ): Promise<PortfolioItemResponseDTO> {
    return this.service.review(
      param.referenceId,
      dto.status,
      dto.rejectionReason,
      req.user.referenceId,
    );
  }
}
