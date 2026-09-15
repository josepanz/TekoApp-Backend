import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LegalDocumentType } from '@prisma/client';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { RequiresActiveConsentGuard } from '@api/legal-consents/guards/requires-active-consent.guard';
import { RequiresActiveConsent } from '@common/decorators/requires-active-consent.decorator';
import { ProfessionalPortfolioService } from '../services/professional-portfolio.service';
import {
  CreatePortfolioItemRequestDTO,
  PortfolioItemReferenceParamDTO,
  ProfessionalReferenceParamDTO,
  UpdatePortfolioItemRequestDTO,
} from '../dtos/request';
import {
  PortfolioItemResponseDTO,
  PortfolioItemsListResponseDTO,
} from '../dtos/response';

interface RequestWithUser {
  user: IUserDataOnJwt;
}

@ApiTags('professional-portfolio')
@Controller()
@ApiBearerAuth()
export class ProfessionalPortfolioController {
  constructor(private readonly service: ProfessionalPortfolioService) {}

  @Post('professionals/me/portfolio')
  @UseGuards(JwtAuthGuard, RequiresActiveConsentGuard)
  @RequiresActiveConsent(LegalDocumentType.IMAGE_USAGE_CONSENT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir una foto al portafolio de trabajos propio' })
  @ApiResponse({ status: 201, type: PortfolioItemResponseDTO })
  async upload(
    @Body() dto: CreatePortfolioItemRequestDTO,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: RequestWithUser,
  ): Promise<PortfolioItemResponseDTO> {
    return this.service.uploadItem(
      req.user.id,
      dto,
      file,
      req.user.referenceId,
    );
  }

  @Get('professionals/me/portfolio')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Obtener mi portafolio (todos los estados y visibilidad)',
  })
  @ApiResponse({ status: 200, type: PortfolioItemsListResponseDTO })
  async myPortfolio(
    @Request() req: RequestWithUser,
  ): Promise<PortfolioItemsListResponseDTO> {
    return this.service.myPortfolio(req.user.id);
  }

  @Patch('professionals/me/portfolio/:referenceId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Editar caption/orden/visibilidad de una foto propia',
  })
  @ApiResponse({ status: 200, type: PortfolioItemResponseDTO })
  async update(
    @Param() param: PortfolioItemReferenceParamDTO,
    @Body() dto: UpdatePortfolioItemRequestDTO,
    @Request() req: RequestWithUser,
  ): Promise<PortfolioItemResponseDTO> {
    return this.service.updateItem(
      req.user.id,
      param.referenceId,
      dto,
      req.user.referenceId,
    );
  }

  @Delete('professionals/me/portfolio/:referenceId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Borrar una foto propia del portafolio' })
  @ApiResponse({ status: 200 })
  async remove(
    @Param() param: PortfolioItemReferenceParamDTO,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    return this.service.deleteItem(req.user.id, param.referenceId);
  }

  @Get('professionals/:referenceId/portfolio/public')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Portafolio visible de un profesional (aprobado + visible)',
  })
  @ApiResponse({ status: 200, type: PortfolioItemsListResponseDTO })
  async publicPortfolio(
    @Param() param: ProfessionalReferenceParamDTO,
  ): Promise<PortfolioItemsListResponseDTO> {
    return this.service.publicPortfolio(param.referenceId);
  }
}
